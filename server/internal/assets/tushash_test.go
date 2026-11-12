package assets

import (
	"bytes"
	"context"
	"crypto/sha1"
	"testing"

	"github.com/tus/tusd/v2/pkg/filestore"
	"github.com/tus/tusd/v2/pkg/handler"
)

func TestHashingStore(t *testing.T) {
	ctx := context.Background()
	data := bytes.Repeat([]byte("wanmory-"), 1000) // 8000 字节
	want := sha1.Sum(data)

	s := newHashingStore(filestore.New(t.TempDir()))
	up, err := s.NewUpload(ctx, handler.FileInfo{Size: int64(len(data))})
	if err != nil {
		t.Fatal(err)
	}
	info, _ := up.GetInfo(ctx)
	// 分三片接着传
	for _, r := range [][2]int{{0, 3000}, {3000, 6000}, {6000, 8000}} {
		u, _ := s.GetUpload(ctx, info.ID)
		if _, err := u.WriteChunk(ctx, int64(r[0]), bytes.NewReader(data[r[0]:r[1]])); err != nil {
			t.Fatal(err)
		}
	}
	sum, started := s.take(info.ID, int64(len(data)))
	if !bytes.Equal(sum, want[:]) || started.IsZero() {
		t.Fatalf("边收边算的校验值不对: %x", sum)
	}

	// 中间断过（下一片不是接着上一片的位置，例如重启后从别处接着传）：不给校验值，入库时自己读文件
	up2, _ := s.NewUpload(ctx, handler.FileInfo{Size: int64(len(data))})
	info2, _ := up2.GetInfo(ctx)
	u, _ := s.GetUpload(ctx, info2.ID)
	u.WriteChunk(ctx, 0, bytes.NewReader(data[:3000]))
	s.mu.Lock()
	s.hashes[info2.ID].offset = 1000 // 假装算过的和写下的对不上
	s.mu.Unlock()
	u.WriteChunk(ctx, 3000, bytes.NewReader(data[3000:]))
	if sum, _ := s.take(info2.ID, int64(len(data))); sum != nil {
		t.Fatal("对不上时不该给校验值")
	}

	// 取消：拆开交给文件存储，不报错
	up3, _ := s.NewUpload(ctx, handler.FileInfo{Size: 10})
	if err := s.AsTerminatableUpload(up3).Terminate(ctx); err != nil {
		t.Fatal(err)
	}
}
