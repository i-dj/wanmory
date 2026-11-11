package assets

import (
	"archive/zip"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wanmory/wanmory/server/internal/auth"

	"github.com/wanmory/wanmory/server/internal/httpx"
)

// maxBatch 是一次最多操作多少张，网页上全选一个大分类也够用
const maxBatch = 20000

// batch 批量修改选中的照片：POST /api/assets/batch，请求体
// {"ids": [...], "favorite": true, "rating": 4, "hidden": true, "deleted": true}，只改带了的字段。
// deleted 为 true 放进「最近删除」，为 false 恢复。
// 拍摄时间和位置（像 macOS「照片」批量调整）：
//   - taken_at_shift（秒）：每张都往后挪这么多，照片之间的间隔不变；taken_at_offset 同时把时区都改成它；
//   - location：都改到这个位置，null 是都去掉位置；
//   - reset：["taken_at"]、["location"] 每张还原成各自文件里记录的。
//
// 只改数据库，不动原文件。返回 {items: 修改后的照片}，网页直接合并进列表。
func (s *Service) batch(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDs []uuid.UUID `json:"ids"`
		Patch
		TakenShift  *int64          `json:"taken_at_shift"`
		TakenOffset *string         `json:"taken_at_offset"`
		Location    json.RawMessage `json:"location"`
		Reset       []string        `json:"reset"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 2<<20)).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	if len(req.IDs) == 0 || len(req.IDs) > maxBatch {
		httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("一次要选 1 到 %d 张", maxBatch))
		return
	}
	if req.Rating != nil && (*req.Rating < 0 || *req.Rating > 5) {
		httpx.Error(w, http.StatusBadRequest, "星级应该是 0 到 5")
		return
	}
	info, err := infoRequest{Location: req.Location, Reset: req.Reset}.patch()
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.TakenOffset != nil {
		if _, err := time.Parse("-07:00", *req.TakenOffset); err != nil {
			httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("时区格式不对：%q", *req.TakenOffset))
			return
		}
	}
	if req.Patch == (Patch{}) && req.TakenShift == nil && req.TakenOffset == nil && info.empty() {
		httpx.Error(w, http.StatusBadRequest, "没有要修改的内容")
		return
	}
	defer s.KickHiddenSync() // 收藏、星级、时间等变了，私有智能相册的「同时隐藏」可能要跟着变
	if req.Patch != (Patch{}) {
		u := auth.UserFrom(r.Context())
		if _, err := s.store.UpdateMany(r.Context(), u.ID, u.IsAdmin, req.IDs, req.Patch); errors.Is(err, ErrNotYours) || errors.Is(err, ErrNotYourDelete) {
			httpx.Error(w, http.StatusForbidden, err.Error())
			return
		} else if err != nil {
			httpx.InternalError(w, err)
			return
		}
	}
	if req.TakenShift != nil || req.TakenOffset != nil {
		var shift int64
		if req.TakenShift != nil {
			shift = *req.TakenShift
		}
		if err := s.store.ShiftTaken(r.Context(), req.IDs, shift, req.TakenOffset); err != nil {
			httpx.InternalError(w, err)
			return
		}
	}
	if !info.empty() {
		// 还原要读每张自己的原始记录，一张张改；删掉了的、找不到的跳过
		for _, id := range req.IDs {
			if err := s.store.UpdateInfo(r.Context(), id, info); err != nil && !errors.Is(err, ErrNotFound) {
				httpx.InternalError(w, err)
				return
			}
		}
	}
	list, err := s.store.GetMany(r.Context(), req.IDs)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"items": list})
}

// purge 永久删除「最近删除」里的照片：POST /api/assets/purge，请求体 {"ids": [...]} 删这几张，{"all": true} 全部删除。
// 只删已经在「最近删除」里的；原始文件也从磁盘上删除，不能恢复。返回删了几张、有几个文件没删掉
func (s *Service) purge(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDs []uuid.UUID `json:"ids"`
		All bool        `json:"all"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 2<<20)).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	if req.All == (len(req.IDs) > 0) || len(req.IDs) > maxBatch {
		httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("要么带 all，要么选 1 到 %d 张", maxBatch))
		return
	}
	// 成员只能永久删除自己传的：选了别人的报错；「全部永久删除」只删自己传的。管理员不限
	u := auth.UserFrom(r.Context())
	var owner *uuid.UUID
	if !u.IsAdmin {
		owner = &u.ID
		if n, err := s.store.othersCount(r.Context(), u.ID, req.IDs); err != nil {
			httpx.InternalError(w, err)
			return
		} else if len(req.IDs) > 0 && n > 0 {
			httpx.Error(w, http.StatusForbidden, ErrNotYourDelete.Error())
			return
		}
	}
	res, err := s.store.PurgeDeleted(r.Context(), req.IDs, owner)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"deleted": res.Assets, "failed_files": len(res.Failed)})
}

// download 下载选中照片的原始文件：POST /api/assets/download，表单字段 ids（逗号分隔）。
// 用表单提交而不是 fetch，浏览器自己接管下载，大文件不用先放进内存。
// 只选了一张就直接下载那个文件；多张打包成 zip，边读边发，不在服务器上生成临时文件。
func (s *Service) download(w http.ResponseWriter, r *http.Request) {
	var ids []uuid.UUID
	for _, v := range strings.Split(r.FormValue("ids"), ",") {
		if id, err := uuid.Parse(strings.TrimSpace(v)); err == nil {
			ids = append(ids, id)
		}
	}
	if len(ids) == 0 || len(ids) > maxBatch {
		httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("一次要选 1 到 %d 张", maxBatch))
		return
	}
	list, err := s.store.GetMany(r.Context(), ids)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	if len(list) == 0 {
		httpx.Error(w, http.StatusNotFound, ErrNotFound.Error())
		return
	}

	if len(list) == 1 {
		a := list[0]
		w.Header().Set("Content-Disposition", attachment(a.FileName))
		http.ServeFile(w, r, a.OriginalPath)
		return
	}

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", attachment(fmt.Sprintf("Wanmory %d 项.zip", len(list))))
	zw := zip.NewWriter(w)
	names := map[string]bool{}
	for _, a := range list {
		if err := addToZip(zw, a, uniqueName(names, a.FileName)); err != nil {
			// 响应头已经发出去了，没法再改成错误；记下来，跳过这个文件
			log.Printf("打包 %s 失败: %v", a.OriginalPath, err)
		}
	}
	if err := zw.Close(); err != nil {
		log.Printf("打包下载失败: %v", err)
	}
}

// addToZip 把一个原始文件放进 zip。照片和视频本身已经压缩过，再压缩省不了多少，直接存进去，快很多。
func addToZip(zw *zip.Writer, a *Asset, name string) error {
	f, err := os.Open(a.OriginalPath)
	if err != nil {
		return err
	}
	defer f.Close()
	dst, err := zw.CreateHeader(&zip.FileHeader{Name: name, Method: zip.Store, Modified: a.FileMtime})
	if err != nil {
		return err
	}
	_, err = io.Copy(dst, f)
	return err
}

// uniqueName 在 zip 里给重名的文件加编号：IMG_0001.jpg、IMG_0001 (1).jpg……
func uniqueName(used map[string]bool, name string) string {
	ext := filepath.Ext(name)
	base := strings.TrimSuffix(name, ext)
	candidate := name
	for i := 1; used[strings.ToLower(candidate)]; i++ {
		candidate = fmt.Sprintf("%s (%d)%s", base, i, ext)
	}
	used[strings.ToLower(candidate)] = true
	return candidate
}

// attachment 是让浏览器下载、并用这个文件名保存的 Content-Disposition，中文文件名也能正确显示。
func attachment(name string) string {
	return mime.FormatMediaType("attachment", map[string]string{"filename": name})
}
