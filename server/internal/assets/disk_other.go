//go:build !unix

package assets

// diskUsage 在不是 Unix 的系统上不统计，菜单底部不显示存储空间
func diskUsage(string) (*DiskUsage, error) { return nil, nil }
