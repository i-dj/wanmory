package assets

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestCleanStaleUploads(t *testing.T) {
	dir := t.TempDir()
	write := func(name string, age time.Duration) {
		p := filepath.Join(dir, name)
		if err := os.WriteFile(p, []byte("x"), 0o644); err != nil {
			t.Fatal(err)
		}
		at := time.Now().Add(-age)
		os.Chtimes(p, at, at)
	}
	// 8 天没动静的上传：要清理
	write("old", 8*24*time.Hour)
	write("old.info", 8*24*time.Hour)
	// info 很旧但 1 小时前还在收数据：数据文件的修改时间才算数，不清理
	write("active", time.Hour)
	write("active.info", 8*24*time.Hour)
	// 与 tus 无关的文件：不动
	write("other.txt", 30*24*time.Hour)
	// 入库超过一天的：清理；入库不到一天的：保留，供没收到响应的客户端重连时查询
	write("finished-old", time.Hour)
	write("finished-old.info", time.Hour)
	write("finished-old.done", 25*time.Hour)
	write("finished-new", time.Hour)
	write("finished-new.info", time.Hour)
	write("finished-new.done", time.Hour)

	cleanStaleUploads(dir, time.Now())

	for name, want := range map[string]bool{
		"old": false, "old.info": false, "active": true, "active.info": true, "other.txt": true,
		"finished-old": false, "finished-old.info": false, "finished-old.done": false,
		"finished-new": true, "finished-new.info": true, "finished-new.done": true,
	} {
		_, err := os.Stat(filepath.Join(dir, name))
		if exists := err == nil; exists != want {
			t.Errorf("%s 存在 = %v，应该是 %v", name, exists, want)
		}
	}
}
