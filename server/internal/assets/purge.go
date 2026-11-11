package assets

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

// PurgeSummary 是清空前的统计，用来让用户确认。
type PurgeSummary struct {
	Assets     int
	Jobs       int
	Embeddings int
}

// PurgeResult 是清空后的结果。Missing 是数据库里有记录、磁盘上已经找不到的文件
// （例如在容器里上传、路径是 /data/... 的文件）；Failed 是删除失败的文件。
type PurgeResult struct {
	Assets  int
	Removed int
	Missing int
	Kept    int // 照片目录（只读挂载）里删不掉、留着的原文件
	Failed  []string

	store *Store // 用来认照片目录里的文件（PurgeDeleted 时有）
}

func Summarize(ctx context.Context, db *sql.DB) (PurgeSummary, error) {
	var s PurgeSummary
	err := db.QueryRowContext(ctx, `
		SELECT (SELECT count(*) FROM assets), (SELECT count(*) FROM jobs), (SELECT count(*) FROM clip_embeddings)`,
	).Scan(&s.Assets, &s.Jobs, &s.Embeddings)
	return s, err
}

// PurgeAll 删除所有照片记录、任务和向量（设置保留），再删除这些照片的原始文件、缩略图和预览图。
// 只删除数据库里记录过的文件，不会整个删除上传目录：上传目录可能是用户自己的文件夹。
// 照片目录（挂载进来的 NAS、移动硬盘）里的原文件不删，下次扫描会重新导入
func PurgeAll(ctx context.Context, db *sql.DB) (PurgeResult, error) {
	var res PurgeResult
	files, err := purgeRows(ctx, db, &res)
	if err != nil {
		return res, err
	}

	// 数据库已经清空，接下来删文件
	removeFiles(files, &res)
	return res, nil
}

// removeFiles 删除文件，个别删不掉只记下来，不影响结果；顺手删掉因此变空的年月目录和缩略图子目录。
// os.Remove 只能删空目录，不会误删别的文件
func removeFiles(files []string, res *PurgeResult) {
	dirs := map[string]bool{}
	for _, f := range files {
		err := os.Remove(f)
		switch {
		case err == nil:
			res.Removed++
			dirs[filepath.Dir(f)] = true
		case errors.Is(err, fs.ErrNotExist):
			res.Missing++
		case res.store != nil && res.store.inLibraryReadOnly(f, err):
			res.Kept++ // 只读挂载的照片目录里的原文件：留着，相册里不再显示
		default:
			res.Failed = append(res.Failed, f)
		}
	}
	for dir := range dirs {
		if os.Remove(dir) == nil {
			os.Remove(filepath.Dir(dir))
		}
	}
}

// PurgeDeleted 永久删除「最近删除」里的照片：ids 为空时是全部，不为空时只删这些（不在「最近删除」里的跳过）。
// 先在一个事务里删掉数据库记录（相册里的、任务、语义向量跟着级联删除），提交后再删原始文件、缩略图和预览图。
// owner 不为空时只删这个人传的（成员清空自己的「最近删除」）
func (s *Store) PurgeDeleted(ctx context.Context, ids []uuid.UUID, owner *uuid.UUID) (PurgeResult, error) {
	var res PurgeResult
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return res, err
	}
	defer tx.Rollback()
	query := `DELETE FROM assets WHERE deleted_at IS NOT NULL`
	args := []any{}
	if len(ids) > 0 {
		args = append(args, uuidStrings(ids))
		query += fmt.Sprintf(` AND id = ANY($%d::uuid[])`, len(args))
	}
	if owner != nil {
		args = append(args, *owner)
		query += fmt.Sprintf(` AND uploaded_by = $%d`, len(args))
	}
	rows, err := tx.QueryContext(ctx, query+` RETURNING original_path, thumbnail_path, preview_path`, args...)
	if err != nil {
		return res, err
	}
	var files []string
	for rows.Next() {
		var orig string
		var thumb, preview *string
		if err := rows.Scan(&orig, &thumb, &preview); err != nil {
			rows.Close()
			return res, err
		}
		res.Assets++
		files = append(files, orig)
		for _, p := range []*string{thumb, preview} {
			if p != nil {
				files = append(files, *p)
			}
		}
		files = withLarge(files, preview)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return res, err
	}
	if err := tx.Commit(); err != nil {
		return res, err
	}
	res.store = s
	removeFiles(files, &res)
	return res, nil
}

// purgeRows 在一个事务里取出所有文件路径并清空表，返回要删除的文件。
func purgeRows(ctx context.Context, db *sql.DB, res *PurgeResult) ([]string, error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 先锁表，避免读路径和清空之间又有新照片上传进来
	if _, err := tx.ExecContext(ctx, `LOCK TABLE assets IN EXCLUSIVE MODE`); err != nil {
		return nil, err
	}
	rows, err := tx.QueryContext(ctx, `
		SELECT original_path, thumbnail_path, preview_path,
		       EXISTS (SELECT 1 FROM library_files l WHERE l.path = original_path)
		FROM assets`)
	if err != nil {
		return nil, err
	}
	var files []string
	for rows.Next() {
		var orig string
		var thumb, preview *string
		var inLibrary bool
		if err := rows.Scan(&orig, &thumb, &preview, &inLibrary); err != nil {
			rows.Close()
			return nil, err
		}
		res.Assets++
		if !inLibrary {
			files = append(files, orig)
		}
		for _, p := range []*string{thumb, preview} {
			if p != nil {
				files = append(files, *p)
			}
		}
		files = withLarge(files, preview)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// CASCADE 会一起清空引用 assets 的 jobs 和 clip_embeddings；RESTART IDENTITY 让任务编号从 1 开始
	if _, err := tx.ExecContext(ctx, `TRUNCATE assets, jobs RESTART IDENTITY CASCADE`); err != nil {
		return nil, err
	}
	return files, tx.Commit()
}
