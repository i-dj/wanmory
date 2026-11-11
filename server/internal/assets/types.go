package assets

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/wanmory/wanmory/server/internal/geo"
)

var ErrNotFound = errors.New("照片不存在")

const (
	TypeImage = "image"
	TypeVideo = "video"
	TypeAudio = "audio"
)

// 照片相关的任务类型。上传后依次执行：metadata → thumbnail → clip、ocr、face。
//
// 处理顺序（jobs.priority，越大越先）：读元数据很快，全部优先做完，拍摄时间就都知道了；
// 之后的缩略图和语义向量按拍摄时间从新到旧，和网页上时间线的顺序一致，屏幕最上面的照片最先出来。
const (
	JobMetadata  = "metadata"  // 读 EXIF：尺寸、拍摄时间、GPS
	JobThumbnail = "thumbnail" // 生成缩略图和 1440 像素预览图
	JobClip      = "clip"      // 计算语义搜索向量，由 AI 服务处理
	JobFace      = "face"      // 找人脸、算人脸特征（AI 服务），再按长相归到人物里（见 faces 包）
	JobOCR       = "ocr"       // 认出照片里的字（AI 服务），按字搜照片、判断证件和文档（见 clip 包）
)

// Asset 是 assets 表里的一行。磁盘路径不返回给前端，文件通过接口访问。
type Asset struct {
	ID         uuid.UUID  `json:"id"`
	Type       string     `json:"type"`
	FileName   string     `json:"file_name"`
	FileSize   int64      `json:"file_size"`
	FileMtime  time.Time  `json:"file_mtime"`
	MimeType   string     `json:"mime_type"`
	Width      *int       `json:"width"`
	Height     *int       `json:"height"`
	DurationMs *int       `json:"duration_ms"`
	TakenAt    *time.Time `json:"taken_at"`
	// TakenAtLocal 是拍摄地当时的钟表时间（不带时区），例如 "2025-06-24T10:03:07"。
	// 网页显示拍摄时间用它，不按浏览器所在时区换算：深圳上午 10 点拍的，在哪看都是上午 10 点。
	TakenAtLocal  *string    `json:"taken_at_local"`
	TakenAtOffset *string    `json:"taken_at_offset"` // EXIF 记录的时区，例如 "+08:00"；没有记录时为空
	Latitude      *float64   `json:"latitude"`
	Longitude     *float64   `json:"longitude"`
	PlaceName     *string    `json:"place_name"` // 用户改位置时选的地名，有它就先显示它；没有时网页按坐标反查
	Geo           *geo.Place `json:"geo"`        // 拍摄地点所在的城市（geo 包后台查好存在库里），还没查或者没有坐标是 null
	CreatedAt     time.Time  `json:"created_at"`
	SortTime      time.Time  `json:"sort_time"` // 时间线上的位置：拍摄时间，没有就用文件修改时间
	Favorite      bool       `json:"favorite"`
	FavoritedAt   *time.Time `json:"favorited_at"` // 什么时候收藏的，没收藏是 null
	Rating        int        `json:"rating"`       // 星级 0–5，0 表示没评
	Hidden        bool       `json:"hidden"`       // 隐藏了：只在隐藏它的人（HiddenBy）的「已隐藏」里显示
	HiddenBy      *uuid.UUID `json:"hidden_by"`
	UploadedBy    *uuid.UUID `json:"uploaded_by"` // 谁传的；账号建起来以前、删掉的成员传的是 null
	UploaderName  *string    `json:"uploader_name"`
	Description   string     `json:"description"` // 用户写的说明，没写是空字符串
	// Edited 是用户在信息栏里改过的字段：'taken_at'（拍摄时间）、'location'（位置）。没改过是空数组
	Edited        []string   `json:"edited"`
	DeletedAt     *time.Time `json:"deleted_at"` // 删除的时间，在「最近删除」里可以恢复；没删除时为空
	HasThumbnail  bool       `json:"has_thumbnail"`
	Beauty        *float32   `json:"beauty"`            // 好不好看（0–1，CLIP 算的，见 clip 包的 tags.go），还没算过是 null
	Subject       *Box       `json:"subject,omitempty"` // 照片里的人脸都在哪个框里，只有精选轮播（Highlights）会填，网页按它裁图
	Camera        *Camera    `json:"camera"`            // 没有任何拍摄参数时为空
	OriginalPath  string     `json:"-"`
	Checksum      []byte     `json:"-"`
	ThumbnailPath *string    `json:"-"`
	PreviewPath   *string    `json:"-"`
}

// Metadata 是 metadata 任务从文件里读出来的信息。
type Metadata struct {
	Width      *int
	Height     *int
	DurationMs *int
	TakenAt    *time.Time
	Latitude   *float64
	Longitude  *float64
	Exif       json.RawMessage
}

// Camera 是从 EXIF 里取出的拍摄参数，用于网页上鼠标悬停显示。
type Camera struct {
	Make          *string  `json:"make"`          // 厂商，例如 Apple、Canon
	Model         *string  `json:"model"`         // 型号，例如 iPhone 16 Pro
	Lens          *string  `json:"lens"`          // 镜头
	ExposureTime  *float64 `json:"exposure_time"` // 快门，秒
	FNumber       *float64 `json:"f_number"`      // 光圈
	ISO           *int     `json:"iso"`
	FocalLength   *float64 `json:"focal_length"`    // 实际焦距，毫米
	FocalLength35 *float64 `json:"focal_length_35"` // 等效 35mm 焦距
	ExposureBias  *float64 `json:"exposure_bias"`   // 曝光补偿，EV，可以是 0 或负数
}

// metadataPriority 让读元数据排在所有缩略图、语义向量任务前面。
const metadataPriority = 1 << 30

// timelinePriority 按排序时间算任务优先级：越新的照片越先处理。以小时为单位，放得进 INT。
func timelinePriority(t time.Time) int {
	return max(0, min(int(t.Unix()/3600), metadataPriority-1))
}

// Box 是照片上的一块区域，左上角和宽高都是占图片宽高的比例（0–1）
type Box struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	W float64 `json:"w"`
	H float64 `json:"h"`
}
