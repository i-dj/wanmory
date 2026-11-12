package assets

import (
	"context"
	"crypto/sha1"
	"hash"
	"io"
	"sync"
	"time"

	"github.com/tus/tusd/v2/pkg/filestore"
	"github.com/tus/tusd/v2/pkg/handler"
)

// hashingStore 包住 tusd 的文件存储：一边收分片一边算 SHA-1，传完时校验值已经有了，
// 入库（「保存中」）不用把整个文件从磁盘再读一遍——几百 MB 的视频在树莓派的 SD 卡、移动硬盘上要读几十秒。
// 只在同一次运行里从头连续收到的才算得出：服务器重启过、某一片写到一半出错时，这个上传就不算了，
// 入库时照旧读一遍文件（见 finishUpload）。
type hashingStore struct {
	inner filestore.FileStore

	mu     sync.Mutex
	hashes map[string]*runningHash
}

type runningHash struct {
	h       hash.Hash
	offset  int64     // 已经算进去的字节数（等于存储里已经写下的）
	started time.Time // 新建的时间（日志里算接收速度）
}

// hashedUpload 是包了一层的上传：写分片时顺便算校验值，其他照旧
type hashedUpload struct {
	handler.Upload
	store *hashingStore
	id    string
}

func newHashingStore(inner filestore.FileStore) *hashingStore {
	return &hashingStore{inner: inner, hashes: map[string]*runningHash{}}
}

// UseIn 代替 filestore 的 UseIn：核心和取消、长度后定、拼接都经过这一层（这几个扩展要拿到 tusd 自己的上传对象）
func (s *hashingStore) UseIn(composer *handler.StoreComposer) {
	composer.UseCore(s)
	composer.UseTerminater(s)
	composer.UseConcater(s)
	composer.UseLengthDeferrer(s)
}

func (s *hashingStore) NewUpload(ctx context.Context, info handler.FileInfo) (handler.Upload, error) {
	u, err := s.inner.NewUpload(ctx, info)
	if err != nil {
		return nil, err
	}
	got, err := u.GetInfo(ctx)
	if err != nil {
		return nil, err
	}
	s.mu.Lock()
	s.prune()
	s.hashes[got.ID] = &runningHash{h: sha1.New(), started: time.Now()}
	s.mu.Unlock()
	return &hashedUpload{Upload: u, store: s, id: got.ID}, nil
}

func (s *hashingStore) GetUpload(ctx context.Context, id string) (handler.Upload, error) {
	u, err := s.inner.GetUpload(ctx, id)
	if err != nil {
		return nil, err
	}
	return &hashedUpload{Upload: u, store: s, id: id}, nil
}

// WriteChunk 只有在这一片正好接着已经算过的位置时才算进校验值；对不上（重启后接着传、上一片出过错）就放弃这个上传的
func (u *hashedUpload) WriteChunk(ctx context.Context, offset int64, src io.Reader) (int64, error) {
	s := u.store
	s.mu.Lock()
	rh := s.hashes[u.id]
	if rh != nil && rh.offset != offset {
		delete(s.hashes, u.id)
		rh = nil
	}
	s.mu.Unlock()
	if rh == nil {
		return u.Upload.WriteChunk(ctx, offset, src)
	}
	cr := &countingReader{r: io.TeeReader(src, rh.h)}
	n, err := u.Upload.WriteChunk(ctx, offset, cr)
	s.mu.Lock()
	if cr.n == n { // 读进来的都写下了（客户端断开时也是这样），校验值和文件内容一致
		rh.offset += n
	} else { // 读了没写下（磁盘出错）：对不上了，入库时重新读文件
		delete(s.hashes, u.id)
	}
	s.mu.Unlock()
	return n, err
}

// take 取走一个传完的上传的校验值和开始时间：只有从头算到 size 的才给，不然返回 nil（入库时自己读文件算）
func (s *hashingStore) take(id string, size int64) ([]byte, time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()
	rh := s.hashes[id]
	delete(s.hashes, id)
	if rh == nil || rh.offset != size {
		var started time.Time
		if rh != nil {
			started = rh.started
		}
		return nil, started
	}
	return rh.h.Sum(nil), rh.started
}

// prune 清掉一天都没传完的（网页关了、取消时没通知到），免得一直占着内存；调用时已经拿着锁
func (s *hashingStore) prune() {
	for id, rh := range s.hashes {
		if time.Since(rh.started) > 24*time.Hour {
			delete(s.hashes, id)
		}
	}
}

func unwrap(u handler.Upload) handler.Upload {
	if h, ok := u.(*hashedUpload); ok {
		return h.Upload
	}
	return u
}

func (s *hashingStore) AsTerminatableUpload(u handler.Upload) handler.TerminatableUpload {
	if h, ok := u.(*hashedUpload); ok {
		s.mu.Lock()
		delete(s.hashes, h.id)
		s.mu.Unlock()
	}
	return s.inner.AsTerminatableUpload(unwrap(u))
}

func (s *hashingStore) AsConcatableUpload(u handler.Upload) handler.ConcatableUpload {
	return concatUnwrap{s.inner.AsConcatableUpload(unwrap(u))}
}

// concatUnwrap：拼接时传进来的几段也是包过的，拆开再交给文件存储（它要自己的类型）
type concatUnwrap struct{ inner handler.ConcatableUpload }

func (c concatUnwrap) ConcatUploads(ctx context.Context, parts []handler.Upload) error {
	raw := make([]handler.Upload, len(parts))
	for i, p := range parts {
		raw[i] = unwrap(p)
	}
	return c.inner.ConcatUploads(ctx, raw)
}

func (s *hashingStore) AsLengthDeclarableUpload(u handler.Upload) handler.LengthDeclarableUpload {
	return s.inner.AsLengthDeclarableUpload(unwrap(u))
}

type countingReader struct {
	r io.Reader
	n int64
}

func (c *countingReader) Read(p []byte) (int, error) {
	n, err := c.r.Read(p)
	c.n += int64(n)
	return n, err
}
