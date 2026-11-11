package assets

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wanmory/wanmory/server/internal/geo"
)

type Store struct {
	db         *sql.DB
	searcher   Searcher  // 按意思搜照片（CLIP），没有设置时搜索词不起作用
	aesthetic  Aesthetic // 精选轮播排先后用的「好照片」方向（CLIP），见 highlights.go
	libraryDir string    // 照片目录，永久删除时认得出只读挂载里删不掉的原文件
}

// Searcher 按意思搜照片，返回搜到的照片 ID（见 clip 包）
type Searcher func(ctx context.Context, text string) ([]uuid.UUID, error)

// ErrSearchUnavailable 是要按意思搜，但 AI 服务连不上，或者模型还在下载、加载
var ErrSearchUnavailable = errors.New("智能搜索要用 AI 服务，现在连不上或者模型还在加载，稍后再试")

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// 拍摄参数直接从 exif 列里取，ExifTool 用 -n 读出来的都是原始数字，取出来是字符串，在 Go 里转换。
const assetColumns = `id, type, original_path, file_size, file_mtime, checksum, mime_type,
	width, height, duration_ms, taken_at, latitude, longitude, thumbnail_path, preview_path, created_at,
	exif->>'Make', exif->>'Model', COALESCE(exif->>'LensModel', exif->>'Lens'),
	exif->>'ExposureTime', exif->>'FNumber', exif->>'ISO', exif->>'FocalLength', exif->>'FocalLengthIn35mmFormat',
	exif->>'ExposureCompensation',
	COALESCE(taken_offset, exif->>'OffsetTimeOriginal', exif->>'OffsetTime'), favorite, rating, hidden, deleted_at,
	description, array_to_json(edited)::text, beauty, place_name,
	(SELECT json_build_object('city', g.city, 'state', g.state, 'country', g.country)::text
	 FROM geo_places g WHERE g.key = ` + geo.KeyExpr + ` AND g.city IS NOT NULL),
	uploaded_by, (SELECT name FROM users u WHERE u.id = uploaded_by), hidden_by, favorited_at`

type scanner interface {
	Scan(dest ...any) error
}

func scanAsset(row scanner) (*Asset, error) {
	var a Asset
	var c Camera
	var exposure, fNumber, iso, focal, focal35, bias *string
	var edited string
	var place *string
	err := row.Scan(&a.ID, &a.Type, &a.OriginalPath, &a.FileSize, &a.FileMtime, &a.Checksum, &a.MimeType,
		&a.Width, &a.Height, &a.DurationMs, &a.TakenAt, &a.Latitude, &a.Longitude,
		&a.ThumbnailPath, &a.PreviewPath, &a.CreatedAt,
		&c.Make, &c.Model, &c.Lens, &exposure, &fNumber, &iso, &focal, &focal35, &bias, &a.TakenAtOffset,
		&a.Favorite, &a.Rating, &a.Hidden, &a.DeletedAt, &a.Description, &edited, &a.Beauty, &a.PlaceName, &place,
		&a.UploadedBy, &a.UploaderName, &a.HiddenBy, &a.FavoritedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal([]byte(edited), &a.Edited); err != nil {
		return nil, fmt.Errorf("edited 格式不对: %w", err)
	}
	if place != nil {
		if err := json.Unmarshal([]byte(*place), &a.Geo); err != nil {
			return nil, fmt.Errorf("城市格式不对: %w", err)
		}
	}
	a.FileName = filepath.Base(a.OriginalPath)
	a.HasThumbnail = a.ThumbnailPath != nil
	a.TakenAtLocal = localClock(a.TakenAt, a.TakenAtOffset)
	a.SortTime = a.FileMtime
	if a.TakenAt != nil {
		a.SortTime = *a.TakenAt
	}

	c.ExposureTime = parseFloat(exposure)
	c.FNumber = parseFloat(fNumber)
	c.FocalLength = parseFloat(focal)
	c.FocalLength35 = parseFloat(focal35)
	c.ExposureBias = parseSigned(bias)
	if f := parseFloat(iso); f != nil {
		v := int(*f)
		c.ISO = &v
	}
	if c != (Camera{}) {
		a.Camera = &c
	}
	return &a, nil
}

// localClock 返回拍摄地的钟表时间。有 EXIF 时区就按它换算；没有时，拍摄时间当初是按服务器时区解释的，
// 再按服务器时区换回来，得到的就是相机里记录的原始时间。
func localClock(t *time.Time, offset *string) *string {
	if t == nil {
		return nil
	}
	loc := time.Local
	if offset != nil {
		if o, err := time.Parse("-07:00", *offset); err == nil {
			_, secs := o.Zone()
			loc = time.FixedZone(*offset, secs)
		}
	}
	s := t.In(loc).Format("2006-01-02T15:04:05")
	return &s
}

// parseFloat 把 EXIF 里的数字字符串转成 float64，不是数字或不大于 0 时返回 nil。
func parseFloat(s *string) *float64 {
	if s == nil {
		return nil
	}
	f, err := strconv.ParseFloat(strings.TrimSpace(*s), 64)
	if err != nil || f <= 0 {
		return nil
	}
	return &f
}

// parseSigned 和 parseFloat 一样，但 0 和负数也算（曝光补偿）。
func parseSigned(s *string) *float64 {
	if s == nil {
		return nil
	}
	f, err := strconv.ParseFloat(strings.TrimSpace(*s), 64)
	if err != nil {
		return nil
	}
	return &f
}

// Create 插入一张新照片，并填回数据库生成的 ID 和创建时间。
func (s *Store) Create(ctx context.Context, tx *sql.Tx, a *Asset) error {
	return tx.QueryRowContext(ctx, `
		INSERT INTO assets (type, original_path, file_size, file_mtime, checksum, mime_type)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at`,
		a.Type, a.OriginalPath, a.FileSize, a.FileMtime, a.Checksum, a.MimeType,
	).Scan(&a.ID, &a.CreatedAt)
}

// Get 按 ID 取一张照片，删除了的也取得到：「最近删除」里还要显示缩略图，恢复后也要接着处理。
func (s *Store) Get(ctx context.Context, id uuid.UUID) (*Asset, error) {
	return scanAsset(s.db.QueryRowContext(ctx, `SELECT `+assetColumns+` FROM assets WHERE id = $1`, id))
}

// GetMany 按 ID 取多张照片（删除了的也取），按时间线从新到旧排；不存在的 ID 跳过。
func (s *Store) GetMany(ctx context.Context, ids []uuid.UUID) ([]*Asset, error) {
	return s.query(ctx, `SELECT `+assetColumns+` FROM assets WHERE id = ANY($1::uuid[])
		ORDER BY `+takenExpr+` DESC, id DESC`, uuidStrings(ids))
}

// uuidStrings 把 ID 转成字符串数组，作为 uuid[] 参数传给数据库。
func uuidStrings(ids []uuid.UUID) []string {
	list := make([]string, len(ids))
	for i, id := range ids {
		list[i] = id.String()
	}
	return list
}

// FindByChecksum 按文件内容查找已有的照片，用来避免重复上传。
func (s *Store) FindByChecksum(ctx context.Context, sum []byte) (*Asset, error) {
	return scanAsset(s.db.QueryRowContext(ctx,
		`SELECT `+assetColumns+` FROM assets WHERE checksum = $1 AND deleted_at IS NULL LIMIT 1`, sum))
}

// Cursor 指向时间线上的一个位置：照片按 (排序时间, ID) 倒序排列，下一页从这个位置之后开始。
// 用位置而不是页码：上传过程中新照片插到前面时，后面的页不会错位重复或漏掉。
type Cursor struct {
	Time time.Time
	ID   uuid.UUID
}

// Encode 把游标编码成不透明的字符串，放在 URL 参数里。
func (c Cursor) Encode() string {
	return base64.RawURLEncoding.EncodeToString([]byte(c.Time.UTC().Format(time.RFC3339Nano) + "_" + c.ID.String()))
}

func ParseCursor(s string) (Cursor, error) {
	var c Cursor
	raw, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		return c, err
	}
	t, id, ok := strings.Cut(string(raw), "_")
	if !ok {
		return c, errors.New("游标格式不对")
	}
	if c.Time, err = time.Parse(time.RFC3339Nano, t); err != nil {
		return c, err
	}
	c.ID, err = uuid.Parse(id)
	return c, err
}

// Order 是照片列表的排序方式。
type Order string

const (
	OrderTimeline  Order = "timeline"  // 按拍摄时间（没有就用文件修改时间），图库默认
	OrderAdded     Order = "added"     // 按上传时间，「最近添加」用
	OrderFavorited Order = "favorited" // 按收藏时间，「收藏」的排序菜单里选
	OrderDeleted   Order = "deleted"   // 按删除时间，「最近删除」用，网页上按删除的日子分组
)

// RecentWindow 是「最近添加」包含多久之内上传的照片，和 Apple 照片的「最近存储」一样只看最近一个月。
const RecentWindow = 30 * 24 * time.Hour

// recentCondition 是「最近添加」的条件，Stats 里的数量和列表用同一个，数字和列表对得上。
var recentCondition = fmt.Sprintf(`created_at > now() - interval '%d seconds'`, int(RecentWindow.Seconds()))

// Scope 是照片列表看的是哪一部分：平时的照片、隐藏了的、删除了的，三者不重叠。
type Scope string

const (
	ScopeNormal  Scope = ""        // 没隐藏也没删除的，图库和各分类都只看这些
	ScopeHidden  Scope = "hidden"  // 「已隐藏」
	ScopeDeleted Scope = "deleted" // 「最近删除」，隐藏了再删除的也在这里
)

var scopeConditions = map[Scope]string{
	ScopeNormal:  `deleted_at IS NULL AND NOT hidden`,
	ScopeHidden:  `deleted_at IS NULL AND hidden`,
	ScopeDeleted: `deleted_at IS NOT NULL`,
}

// Filter 是照片列表的排序和筛选，对应网页左侧的各个分类。
type Filter struct {
	Scope Scope
	Order Order
	// Sort、Asc 是网页上「排序」菜单选的：按拍摄时间还是上传时间、从旧到新还是从新到旧。
	// Sort 为空时按 Order 的默认（各分类自己的时间，从新到旧）
	Sort       Order // OrderTimeline 或 OrderAdded
	Asc        bool
	Favorite   bool        // 只要收藏的
	Rating     int         // 只要这个星级的（1–5），0 表示不限
	Album      *uuid.UUID  // 只要这个相册里的
	Person     *uuid.UUID  // 只要有这个人的
	With       *uuid.UUID  // 而且也有这个人的（两个人的合照）
	Near       *[4]float64 // 只要拍摄地点在这个范围里的：最南、最西、最北、最东（纬度、经度）
	City       *CityFilter // 只要这个城市的（足迹里点开的一个城市），见 CityFilter
	Dated      bool        // 只要文件里记录了拍摄时间的（按年龄筛时，用文件修改时间的不准）
	Query      string      // 按意思搜（「海边日落」「生日蛋糕」），由 CLIP 找出照片
	Camera     string      // 只要这个型号的相机（EXIF 的 Model）拍的
	Lens       string      // 只要这个镜头拍的
	Tag        string      // 只要这个分类的：screenshot、id、document、food、pet、scenery
	Kinds      []string    // 只要这几种：photo 照片（不含动图）、video 视频、gif 动图；空的是都要
	User       uuid.UUID   // 谁在看：「已隐藏」只列他自己隐藏的（见 where）
	Uploaders  []uuid.UUID // 只要这几个人传的；空的是都要
	matches    []uuid.UUID // Query 搜到的照片（resolve 填）
	smart      *SmartRules // 相册是自动同步的智能相册时，按它的条件筛（resolveAlbum 填）
	ownPrivate bool        // 相册是 User 自己的私有相册（resolveAlbum 填）
	blocked    bool        // 相册是别人的私有相册，User 看不到（resolveAlbum 填）
	// 只要拍摄时间在 [From, To) 之间的，网页上在日历里点了某年、某月、某天时用。为空表示不限
	From, To *time.Time
}

// ParseFilter 从 URL 参数读筛选条件：view=recent（最近 30 天上传的，按上传时间排）、view=hidden、view=deleted、
// favorite=true、rating=1..5、album=<相册 ID>、person=<人物 ID>、with=<另一个人物 ID>（两个人的合照）、
// near=南,西,北,东（拍摄地点在这个经纬度范围里的）、city=公里;纬度,经度;…|纬度,经度;…（见 CityFilter）、dated=true（只要有拍摄时间的）、
// q=搜索词（按意思搜）、camera=相机型号、lens=镜头、tag=分类、kind=photo|video|gif（可以几种用逗号隔开：kind=photo,video）、uploader=<家庭成员 ID>（只要他传的，几个人用逗号隔开）、
// from / to（RFC 3339 时间，按拍摄时间筛选，含 from 不含 to）、sort=taken|added（按拍摄时间 / 上传时间排）、dir=asc（从旧到新）。
func ParseFilter(q url.Values) (Filter, error) {
	f := Filter{Order: OrderTimeline}
	switch q.Get("view") {
	case "recent":
		f.Order = OrderAdded
	case "hidden":
		f.Scope = ScopeHidden
	case "deleted":
		f.Scope = ScopeDeleted
		f.Order = OrderDeleted
	}
	switch q.Get("sort") {
	case "":
	case "taken":
		f.Sort = OrderTimeline
	case "added":
		f.Sort = OrderAdded
	case "favorited":
		f.Sort = OrderFavorited
	default:
		return f, errors.New("sort 应该是 taken、added 或 favorited")
	}
	f.Asc = q.Get("dir") == "asc"
	f.Favorite = q.Get("favorite") == "true"
	f.Dated = q.Get("dated") == "true"
	f.Query = strings.TrimSpace(q.Get("q"))
	f.Camera = q.Get("camera")
	f.Lens = q.Get("lens")
	f.Tag = q.Get("tag")
	if v := q.Get("kind"); v != "" {
		for _, k := range strings.Split(v, ",") {
			if k != "photo" && k != "video" && k != "gif" {
				return f, errors.New("kind 应该是 photo、video、gif，几种用逗号隔开")
			}
			if !slices.Contains(f.Kinds, k) {
				f.Kinds = append(f.Kinds, k)
			}
		}
	}
	if v := q.Get("rating"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > 5 {
			return f, errors.New("rating 应该是 1 到 5")
		}
		f.Rating = n
	}
	if v := q.Get("uploader"); v != "" {
		for _, s := range strings.Split(v, ",") {
			id, err := uuid.Parse(s)
			if err != nil {
				return f, errors.New("uploader 应该是成员 ID，几个用逗号隔开")
			}
			f.Uploaders = append(f.Uploaders, id)
		}
	}
	if v := q.Get("person"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			return f, errors.New("person 应该是人物 ID")
		}
		f.Person = &id
	}
	if v := q.Get("with"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			return f, errors.New("with 应该是人物 ID")
		}
		f.With = &id
	}
	if v := q.Get("near"); v != "" {
		parts := strings.Split(v, ",")
		var box [4]float64
		ok := len(parts) == 4
		for i := 0; ok && i < 4; i++ {
			n, err := strconv.ParseFloat(parts[i], 64)
			ok = err == nil
			box[i] = n
		}
		if !ok || box[0] > box[2] || box[1] > box[3] {
			return f, errors.New("near 应该是 南,西,北,东 四个数")
		}
		f.Near = &box
	}
	if v := q.Get("city"); v != "" {
		c, err := parseCity(v)
		if err != nil {
			return f, err
		}
		f.City = c
	}
	if v := q.Get("album"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			return f, errors.New("album 应该是相册 ID")
		}
		f.Album = &id
	}
	for key, dst := range map[string]**time.Time{"from": &f.From, "to": &f.To} {
		if v := q.Get(key); v != "" {
			t, err := time.Parse(time.RFC3339Nano, v)
			if err != nil {
				return f, fmt.Errorf("%s 应该是 RFC 3339 时间", key)
			}
			*dst = &t
		}
	}
	return f, nil
}

// takenExpr 是照片的拍摄时间（没有就用文件修改时间），按日期筛选和统计都用它，和排序方式无关。
const takenExpr = "COALESCE(taken_at, file_mtime)"

// dateExpr 是日历、时间线按哪个时间分：「最近添加」按上传时间（和它的排序一致），其他按拍摄时间
func (f Filter) dateExpr() string {
	if f.Order == OrderAdded {
		return "created_at"
	}
	return takenExpr
}

// sortOrder 是实际按什么排：排序菜单选了就按它，不然按分类自己的
func (f Filter) sortOrder() Order {
	if f.Sort != "" {
		return f.Sort
	}
	return f.Order
}

// sortExpr 是排序用的列，和索引里的表达式一致才能用上索引。
func (f Filter) sortExpr() string {
	switch f.sortOrder() {
	case OrderAdded:
		return "created_at"
	case OrderDeleted:
		return "deleted_at"
	case OrderFavorited:
		return "COALESCE(favorited_at, created_at)" // 没收藏的（不在「收藏」里时）按上传时间
	}
	return takenExpr
}

// where 返回筛选条件的 WHERE 子句，参数追加到 args 里。
func (f Filter) where(args *[]any) string {
	sql := ` WHERE ` + scopeConditions[f.Scope]
	// 自己的私有相册、人物页、足迹（城市、地图范围）里，自己隐藏了的照片照样显示（别人看不到，见 faces.visibleTo）
	if f.Scope == ScopeNormal && (f.ownPrivate || f.Person != nil || f.City != nil || f.Near != nil) && f.User != uuid.Nil {
		*args = append(*args, f.User)
		sql = fmt.Sprintf(` WHERE deleted_at IS NULL AND (NOT hidden OR hidden_by = $%d)`, len(*args))
	}
	if f.blocked { // 看的是别人的私有相册：什么都没有
		sql += ` AND false`
	}
	if f.Scope == ScopeHidden { // 每个人的「已隐藏」只有自己隐藏的；隐藏的照片别人哪里都看不到（ScopeNormal 本来就不要）
		*args = append(*args, f.User)
		sql += fmt.Sprintf(` AND hidden_by = $%d`, len(*args))
	}
	if f.Order == OrderAdded {
		sql += ` AND ` + recentCondition
	}
	if f.Favorite {
		sql += ` AND favorite`
	}
	if len(f.Uploaders) > 0 {
		*args = append(*args, uuidStrings(f.Uploaders))
		sql += fmt.Sprintf(` AND uploaded_by = ANY($%d::uuid[])`, len(*args))
	}
	if f.Dated {
		sql += ` AND taken_at IS NOT NULL`
	}
	if f.Query != "" {
		*args = append(*args, uuidStrings(f.matches))
		sql += fmt.Sprintf(` AND id = ANY($%d::uuid[])`, len(*args))
	}
	if f.Camera != "" {
		*args = append(*args, f.Camera)
		sql += fmt.Sprintf(` AND %s = $%d`, smartFields["camera"].expr, len(*args))
	}
	if f.Lens != "" {
		*args = append(*args, f.Lens)
		sql += fmt.Sprintf(` AND %s = $%d`, smartFields["lens"].expr, len(*args))
	}
	if f.Tag != "" {
		*args = append(*args, f.Tag)
		cond := fmt.Sprintf(`$%d = ANY(tags)`, len(*args))
		if f.Tag == "screenshot" { // 文件名、iPhone 的标记认得出来的截图，不用等 AI
			cond = `(` + cond + ` OR ` + photoFlags["screenshot"] + `)`
		}
		sql += ` AND ` + cond
	}
	if len(f.Kinds) > 0 {
		kinds := map[string]string{
			"photo": `(type = 'image' AND mime_type <> 'image/gif')`,
			"video": `type = 'video'`,
			"gif":   `mime_type = 'image/gif'`,
		}
		conds := make([]string, len(f.Kinds))
		for i, k := range f.Kinds {
			conds[i] = kinds[k]
		}
		sql += ` AND (` + strings.Join(conds, ` OR `) + `)`
	}
	if f.Rating > 0 {
		*args = append(*args, f.Rating)
		sql += fmt.Sprintf(` AND rating = $%d`, len(*args))
	}
	if f.smart != nil {
		sql += ` AND ` + f.smart.SQL(args)
	} else if f.Album != nil {
		*args = append(*args, *f.Album)
		sql += ` AND ` + fmt.Sprintf(albumCondition, len(*args))
	}
	if f.Person != nil {
		*args = append(*args, *f.Person)
		sql += fmt.Sprintf(` AND id IN (SELECT asset_id FROM faces WHERE person_id = $%d)`, len(*args))
	}
	if f.With != nil {
		*args = append(*args, *f.With)
		sql += fmt.Sprintf(` AND id IN (SELECT asset_id FROM faces WHERE person_id = $%d)`, len(*args))
	}
	if f.Near != nil {
		n := len(*args)
		*args = append(*args, f.Near[0], f.Near[1], f.Near[2], f.Near[3])
		sql += fmt.Sprintf(` AND latitude BETWEEN $%d AND $%d AND longitude BETWEEN $%d AND $%d`, n+1, n+3, n+2, n+4)
	}
	if f.City != nil {
		sql += ` AND ` + f.City.sql(args)
	}
	if f.From != nil {
		*args = append(*args, *f.From)
		sql += fmt.Sprintf(` AND %s >= $%d`, f.dateExpr(), len(*args))
	}
	if f.To != nil {
		*args = append(*args, *f.To)
		sql += fmt.Sprintf(` AND %s < $%d`, f.dateExpr(), len(*args))
	}
	return sql
}

// sortKey 返回照片在这个排序方式下的位置，用来生成下一页的游标。
func (f Filter) sortKey(a *Asset) time.Time {
	switch {
	case f.sortOrder() == OrderAdded:
		return a.CreatedAt
	case f.sortOrder() == OrderDeleted && a.DeletedAt != nil:
		return *a.DeletedAt
	case f.sortOrder() == OrderFavorited:
		if a.FavoritedAt != nil {
			return *a.FavoritedAt
		}
		return a.CreatedAt
	}
	return a.SortTime
}

// Page 按排序方式返回一页照片（默认从新到旧，Asc 时从旧到新）；after 为空时从第一张开始。
// 返回的 next 指向这页最后一张，没有更多时为空。
func (s *Store) Page(ctx context.Context, f Filter, after *Cursor, limit int) (list []*Asset, next *Cursor, err error) {
	if err := s.resolve(ctx, &f); err != nil {
		return nil, nil, err
	}
	args := []any{limit + 1} // 多取一张，判断后面还有没有
	query := `SELECT ` + assetColumns + ` FROM assets` + f.where(&args)
	if after != nil {
		args = append(args, after.Time, after.ID)
		cmp := "<"
		if f.Asc {
			cmp = ">"
		}
		query += fmt.Sprintf(` AND (%s, id) %s ($%d, $%d)`, f.sortExpr(), cmp, len(args)-1, len(args))
	}
	dir := "DESC"
	if f.Asc {
		dir = "ASC"
	}
	query += fmt.Sprintf(` ORDER BY %s %s, id %s LIMIT $1`, f.sortExpr(), dir, dir)

	list, err = s.query(ctx, query, args...)
	if err != nil {
		return nil, nil, err
	}
	if len(list) > limit {
		list = list[:limit]
		last := list[limit-1]
		next = &Cursor{Time: f.sortKey(last), ID: last.ID}
	}
	return list, next, nil
}

// Summary 是一个分类的概要，显示在网页标题和下面一行：时间范围，「34 张照片、1 个视频 · 2.3 GB」。
type Summary struct {
	Photos int        `json:"photos"`
	Videos int        `json:"videos"`
	Bytes  int64      `json:"bytes"` // 原始文件一共占多少空间
	First  *time.Time `json:"first"` // 最早一张的拍摄时间
	Last   *time.Time `json:"last"`
}

func (s *Store) Summary(ctx context.Context, f Filter) (Summary, error) {
	var sum Summary
	if err := s.resolve(ctx, &f); err != nil {
		return sum, err
	}
	args := []any{}
	err := s.db.QueryRowContext(ctx, `
		SELECT count(*) FILTER (WHERE type = 'image'), count(*) FILTER (WHERE type = 'video'),
		       COALESCE(sum(file_size), 0),
		       min(`+takenExpr+`), max(`+takenExpr+`)
		FROM assets`+f.where(&args), args...,
	).Scan(&sum.Photos, &sum.Videos, &sum.Bytes, &sum.First, &sum.Last)
	return sum, err
}

// DateUnit 是日历按什么分组统计。
type DateUnit string

const (
	UnitYear  DateUnit = "year"
	UnitMonth DateUnit = "month"
	UnitDay   DateUnit = "day"
)

// dateFormats 是每种分组的日期写法（PostgreSQL to_char），也是返回给网页的 key：2025、2025-06、2025-06-14。
var dateFormats = map[DateUnit]string{UnitYear: "YYYY", UnitMonth: "YYYY-MM", UnitDay: "YYYY-MM-DD"}

// DateCount 是一年、一个月或一天里有多少张照片。
type DateCount struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

// DateCounts 按拍摄时间（「最近添加」按上传时间，见 dateExpr）分组统计照片数，从新到旧。日期按 tz 时区（网页所在的时区）划分，
// 和网页按本地时间算出的 from / to 对得上。
func (s *Store) DateCounts(ctx context.Context, f Filter, unit DateUnit, tz string) ([]DateCount, error) {
	format, ok := dateFormats[unit]
	if !ok {
		return nil, fmt.Errorf("不支持的分组: %q", unit)
	}
	if err := s.resolve(ctx, &f); err != nil {
		return nil, err
	}
	args := []any{tz}
	query := fmt.Sprintf(`
		SELECT to_char(%s AT TIME ZONE $1, '%s') AS d, count(*)
		FROM assets%s
		GROUP BY d ORDER BY d DESC`, f.dateExpr(), format, f.where(&args))
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []DateCount{}
	for rows.Next() {
		var c DateCount
		if err := rows.Scan(&c.Date, &c.Count); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

// ChangedSince 返回 since 之后新增或变化过的照片（入库、读完元数据、生成缩略图、隐藏、删除都会更新 updated_at），
// 网页用它增量刷新已经加载的照片，不用每次重新拉整个列表。隐藏和删除了的也返回，网页据此把它们从列表里拿掉。
// album 不为空时只返回这个相册里的。
func (s *Store) ChangedSince(ctx context.Context, user uuid.UUID, since time.Time, album *uuid.UUID, limit int) ([]*Asset, error) {
	args := []any{since, limit}
	query := `SELECT ` + assetColumns + ` FROM assets WHERE updated_at > $1`
	if album != nil {
		f := Filter{Album: album, User: user}
		if err := s.resolve(ctx, &f); err != nil {
			return nil, err
		}
		if f.blocked {
			return []*Asset{}, nil
		}
		if f.smart != nil {
			query += ` AND ` + f.smart.SQL(&args)
		} else {
			args = append(args, *album)
			query += ` AND ` + fmt.Sprintf(albumCondition, len(args))
		}
	}
	return s.query(ctx, query+` ORDER BY updated_at LIMIT $2`, args...)
}

// Now 返回数据库的当前时间。增量刷新用数据库时间做基准，不受服务器和数据库时钟差影响。
func (s *Store) Now(ctx context.Context) (time.Time, error) {
	var t time.Time
	err := s.db.QueryRowContext(ctx, `SELECT now()`).Scan(&t)
	return t, err
}

func (s *Store) query(ctx context.Context, query string, args ...any) ([]*Asset, error) {
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []*Asset{}
	for rows.Next() {
		a, err := scanAsset(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, rows.Err()
}

func (s *Store) UpdateMetadata(ctx context.Context, id uuid.UUID, m Metadata) error {
	exif := "{}"
	if len(m.Exif) > 0 {
		exif = string(m.Exif)
	}
	// 用户在信息栏里改过的拍摄时间、位置不用文件里的覆盖
	_, err := s.db.ExecContext(ctx, `
		UPDATE assets SET width = $2, height = $3, duration_ms = $4,
		       taken_at = CASE WHEN 'taken_at' = ANY(edited) THEN taken_at ELSE $5 END,
		       latitude = CASE WHEN 'location' = ANY(edited) THEN latitude ELSE $6 END,
		       longitude = CASE WHEN 'location' = ANY(edited) THEN longitude ELSE $7 END,
		       exif = $8, updated_at = now()
		WHERE id = $1`,
		id, m.Width, m.Height, m.DurationMs, m.TakenAt, m.Latitude, m.Longitude, exif)
	return err
}

// UpdateMarks 修改收藏和星级，传 nil 的不改。会更新 updated_at，其他打开着的网页通过增量刷新拿到变化。
func (s *Store) UpdateMarks(ctx context.Context, id uuid.UUID, favorite *bool, rating *int) error {
	res, err := s.db.ExecContext(ctx, `
		UPDATE assets SET favorite = COALESCE($2, favorite), rating = COALESCE($3, rating),
		       favorited_at = CASE WHEN $2::boolean IS NULL THEN favorited_at WHEN $2 THEN COALESCE(favorited_at, now()) END,
		       updated_at = now()
		WHERE id = $1 AND deleted_at IS NULL`, id, favorite, rating)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// Patch 是批量修改的内容，为空的字段不改。
type Patch struct {
	Favorite *bool `json:"favorite"`
	Rating   *int  `json:"rating"`
	Hidden   *bool `json:"hidden"`
	Deleted  *bool `json:"deleted"` // true 放进「最近删除」，false 恢复
}

// ErrNotYours 是要隐藏别人传的照片：隐藏的照片别人都看不到，只能隐藏自己传的
var ErrNotYours = errors.New("只能隐藏自己上传的照片")

// ErrNotYourDelete 是成员要删除（或恢复、永久删除）别人传的照片：只有管理员能删任何人的
var ErrNotYourDelete = errors.New("只能删除自己上传的内容。如需删除，请联系管理员。")

// othersCount 是 ids 里有几张不是 user 传的
func (s *Store) othersCount(ctx context.Context, user uuid.UUID, ids []uuid.UUID) (int, error) {
	var n int
	err := s.db.QueryRowContext(ctx, `
		SELECT count(*) FROM assets WHERE id = ANY($1::uuid[]) AND uploaded_by IS DISTINCT FROM $2`,
		uuidStrings(ids), user).Scan(&n)
	return n, err
}

// UpdateMany 批量修改照片，返回实际改到的张数。删除过的照片只能恢复，不能改别的。
// user 是谁在改：隐藏只能隐藏他自己传的（有别人的就整批不改，返回 ErrNotYours），取消隐藏只改他自己隐藏的；
// 删除、恢复也只能是自己传的，管理员（admin）可以删任何人的（有别人的就整批不改，返回 ErrNotYourDelete）
func (s *Store) UpdateMany(ctx context.Context, user uuid.UUID, admin bool, ids []uuid.UUID, p Patch) (int64, error) {
	if p.Deleted != nil && !admin {
		if n, err := s.othersCount(ctx, user, ids); err != nil {
			return 0, err
		} else if n > 0 {
			return 0, ErrNotYourDelete
		}
	}
	if p.Hidden != nil && *p.Hidden {
		var others int
		if err := s.db.QueryRowContext(ctx, `
			SELECT count(*) FROM assets WHERE id = ANY($1::uuid[]) AND uploaded_by IS DISTINCT FROM $2`,
			uuidStrings(ids), user).Scan(&others); err != nil {
			return 0, err
		}
		if others > 0 {
			return 0, ErrNotYours
		}
	}
	res, err := s.db.ExecContext(ctx, `
		UPDATE assets SET
			favorite = COALESCE($2, favorite),
			favorited_at = CASE WHEN $2::boolean IS NULL THEN favorited_at WHEN $2 THEN COALESCE(favorited_at, now()) END,
			rating = COALESCE($3, rating),
			hidden = CASE WHEN $4::boolean IS NULL THEN hidden
			              WHEN $4::boolean THEN true
			              WHEN hidden_by = $6 THEN false ELSE hidden END,
			hidden_by = CASE WHEN $4::boolean IS NULL THEN hidden_by
			                 WHEN $4::boolean THEN $6
			                 WHEN hidden_by = $6 THEN NULL ELSE hidden_by END,
			hidden_via = CASE WHEN $4::boolean IS NULL THEN hidden_via
			                  WHEN $4::boolean OR hidden_by = $6 THEN NULL ELSE hidden_via END, -- 自己动手隐藏、取消的，不再算哪个相册隐藏的
			deleted_at = CASE WHEN $5::boolean IS NULL THEN deleted_at
			                  WHEN $5::boolean THEN COALESCE(deleted_at, now()) END,
			updated_at = now()
		WHERE id = ANY($1::uuid[]) AND (deleted_at IS NULL OR $5::boolean IS NOT NULL)`,
		uuidStrings(ids), p.Favorite, p.Rating, p.Hidden, p.Deleted, user)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

// SetUploader 记下照片是谁传的（重复上传已有的照片不改原来的上传者）
func (s *Store) SetUploader(ctx context.Context, id, user uuid.UUID) error {
	if user == uuid.Nil {
		return nil
	}
	_, err := s.db.ExecContext(ctx, `UPDATE assets SET uploaded_by = $2 WHERE id = $1 AND uploaded_by IS NULL`, id, user)
	return err
}

func (s *Store) SetDerivatives(ctx context.Context, id uuid.UUID, thumbnail, preview string) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE assets SET thumbnail_path = $2, preview_path = $3, updated_at = now()
		WHERE id = $1`, id, thumbnail, preview)
	return err
}

// Stats 是按照片统计的处理进度，给网页显示「处理中 45 / 100 张」用。
type Stats struct {
	Total      int    `json:"total"`       // 照片总数
	Processing int    `json:"processing"`  // 还没生成缩略图、也没有失败的
	Failed     int    `json:"failed"`      // 读元数据或生成缩略图失败、重试次数也用完了的
	ClipQueued int    `json:"clip_queued"` // 在排队等 AI 服务算语义向量的
	Recent     int    `json:"recent"`      // 最近 30 天上传了多少张，网页左侧「最近添加」旁边显示
	Hidden     int    `json:"hidden"`      // 隐藏了多少张（不算在 Total 里）
	Deleted    int    `json:"deleted"`     // 「最近删除」里有多少张
	Favorites  int    `json:"favorites"`   // 收藏了多少张，网页左侧分类旁边显示
	Ratings    [6]int `json:"ratings"`     // 各星级各有多少张，下标是星级（0 是没评）
}

func (s *Store) Stats(ctx context.Context, user uuid.UUID) (Stats, error) {
	var st Stats
	err := s.db.QueryRowContext(ctx, `
		WITH failed AS (
			SELECT DISTINCT asset_id FROM jobs
			WHERE type IN ('metadata', 'thumbnail') AND status = 'failed'
		)
		SELECT
			count(*) FILTER (WHERE NOT a.hidden),
			count(*) FILTER (WHERE a.hidden AND a.hidden_by = $1),
			count(*) FILTER (WHERE a.thumbnail_path IS NULL AND f.asset_id IS NULL),
			count(*) FILTER (WHERE a.thumbnail_path IS NULL AND f.asset_id IS NOT NULL),
			count(*) FILTER (WHERE NOT a.hidden AND a.`+recentCondition+`),
			(SELECT count(*) FROM jobs WHERE type = 'clip' AND status IN ('pending', 'running')),
			(SELECT count(*) FROM assets WHERE deleted_at IS NOT NULL)
		FROM assets a LEFT JOIN failed f ON f.asset_id = a.id
		WHERE a.deleted_at IS NULL`, user,
	).Scan(&st.Total, &st.Hidden, &st.Processing, &st.Failed, &st.Recent, &st.ClipQueued, &st.Deleted)
	if err != nil {
		return st, err
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT rating, count(*), count(*) FILTER (WHERE favorite)
		FROM assets WHERE `+scopeConditions[ScopeNormal]+` GROUP BY rating`)
	if err != nil {
		return st, err
	}
	defer rows.Close()
	for rows.Next() {
		var rating, n, fav int
		if err := rows.Scan(&rating, &n, &fav); err != nil {
			return st, err
		}
		if rating >= 0 && rating <= 5 {
			st.Ratings[rating] = n
		}
		st.Favorites += fav
	}
	return st, rows.Err()
}
