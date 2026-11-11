package assets

import (
	"context"
	"errors"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

// 照片目录：把 NAS、移动硬盘上已有的照片挂载到照片目录下（默认 <数据目录>/library，Docker 里是 /photos），
// 相册自己定时扫一遍，新的照片、视频原地导入（不复制、不移动），然后和上传的一样读信息、生成缩略图、AI 识别。
// 可以挂多个目录（各挂到照片目录下的一个子目录），可以只读挂载：相册不会往里面写东西；
// 只读的目录里的照片在相册里永久删除时文件留着，只是相册里不再显示，也不会再被扫进来。
// 扫到过的文件记在 library_files 表里，每个文件只导入一次

const libraryEvery = 15 * time.Minute

// SetLibraryDir 设照片目录（不存在也没关系，挂载了再扫）
func (s *Service) SetLibraryDir(dir string) {
	if abs, err := filepath.Abs(dir); err == nil {
		dir = abs
	}
	s.libraryDir = dir
	s.store.libraryDir = dir
}

// RunLibrary 启动后过一会儿扫一遍照片目录，之后每 15 分钟扫一遍，直到 ctx 结束
func (s *Service) RunLibrary(ctx context.Context) {
	if s.libraryDir == "" {
		return
	}
	timer := time.NewTimer(20 * time.Second)
	defer timer.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-timer.C:
		}
		if n, err := s.scanLibrary(ctx); err != nil {
			log.Printf("照片目录：扫描 %s 出错: %v", s.libraryDir, err)
		} else if n > 0 {
			log.Printf("照片目录：从 %s 导入了 %d 个新文件，接着读信息、生成缩略图、AI 识别", s.libraryDir, n)
		}
		timer.Reset(libraryEvery)
	}
}

// scanLibrary 扫一遍照片目录，导入没见过的照片和视频，返回导入了几个
func (s *Service) scanLibrary(ctx context.Context) (int, error) {
	if _, err := os.Stat(s.libraryDir); errors.Is(err, fs.ErrNotExist) {
		return 0, nil
	}
	seen, err := s.store.libraryPaths(ctx)
	if err != nil {
		return 0, err
	}
	added := 0
	err = filepath.WalkDir(s.libraryDir, func(path string, d fs.DirEntry, err error) error {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if err != nil {
			return nil // 读不了的目录跳过，接着扫别的
		}
		name := d.Name()
		if d.IsDir() {
			if path != s.libraryDir && skipDir(name) {
				return filepath.SkipDir
			}
			return nil
		}
		if strings.HasPrefix(name, ".") || seen[path] || !d.Type().IsRegular() {
			return nil
		}
		if _, err := kindOf(name); err != nil {
			return nil
		}
		ok, err := s.importLibraryFile(ctx, path)
		if err != nil {
			log.Printf("照片目录：导入 %s 失败: %v", path, err)
			return nil
		}
		if ok {
			added++
		}
		return nil
	})
	if errors.Is(err, context.Canceled) {
		err = nil
	}
	return added, err
}

// skipDir 是不扫的目录：隐藏目录、NAS 自己的缩略图和回收站
func skipDir(name string) bool {
	if strings.HasPrefix(name, ".") || strings.HasPrefix(name, "@") || strings.HasPrefix(name, "#") {
		return true // .thumbnails、@eaDir（群晖）、#recycle（群晖回收站）
	}
	switch name {
	case "$RECYCLE.BIN", "System Volume Information", "lost+found", "@Recycle", ".@__thumb":
		return true
	}
	return false
}

// importLibraryFile 原地导入一个文件：内容和已有照片一样的不导入（只记下路径），返回有没有新加照片
func (s *Service) importLibraryFile(ctx context.Context, path string) (bool, error) {
	st, err := os.Stat(path)
	if err != nil || st.Size() == 0 {
		return false, err
	}
	kind, _ := kindOf(path)
	sum, err := sha1File(path)
	if err != nil {
		return false, err
	}
	if _, err := s.store.FindByChecksum(ctx, sum); err == nil {
		return false, s.store.rememberLibraryFile(ctx, path, nil)
	} else if !errors.Is(err, ErrNotFound) {
		return false, err
	}
	a := &Asset{
		Type:         kind.typ,
		OriginalPath: path,
		FileName:     filepath.Base(path),
		FileSize:     st.Size(),
		FileMtime:    st.ModTime(),
		Checksum:     sum,
		MimeType:     kind.mime,
	}
	if err := s.insertWithJob(ctx, a); err != nil {
		return false, err
	}
	return true, s.store.rememberLibraryFile(ctx, path, &a.ID)
}

func (s *Store) libraryPaths(ctx context.Context) (map[string]bool, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT path FROM library_files`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	seen := map[string]bool{}
	for rows.Next() {
		var p string
		if err := rows.Scan(&p); err != nil {
			return nil, err
		}
		seen[p] = true
	}
	return seen, rows.Err()
}

func (s *Store) rememberLibraryFile(ctx context.Context, path string, asset any) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO library_files (path, asset_id) VALUES ($1, $2) ON CONFLICT (path) DO NOTHING`, path, asset)
	return err
}

// inLibraryReadOnly 是照片目录里因为只读（或者没权限）删不掉的文件：永久删除时不算失败
func (s *Store) inLibraryReadOnly(path string, err error) bool {
	if s.libraryDir == "" || !strings.HasPrefix(path, s.libraryDir+string(filepath.Separator)) {
		return false
	}
	return errors.Is(err, fs.ErrPermission) || errors.Is(err, syscall.EROFS) || errors.Is(err, syscall.EPERM)
}
