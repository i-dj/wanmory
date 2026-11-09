//go:build unix

package assets

import "syscall"

// diskUsage 是 dir 所在磁盘的总容量和还能用的空间（字节），左边菜单底部「存储空间」显示
func diskUsage(dir string) (*DiskUsage, error) {
	var st syscall.Statfs_t
	if err := syscall.Statfs(dir, &st); err != nil {
		return nil, err
	}
	bs := uint64(st.Bsize)
	return &DiskUsage{Total: st.Blocks * bs, Free: st.Bavail * bs}, nil
}
