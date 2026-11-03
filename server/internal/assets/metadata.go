package assets

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/wanmory/wanmory/server/internal/jobs"
)

// runMetadata 用 ExifTool 读取尺寸、拍摄时间和 GPS，完成后加入 thumbnail 任务。
func (s *Service) runMetadata(ctx context.Context, job *jobs.Job) error {
	if job.AssetID == nil {
		return errors.New("metadata 任务缺少 asset_id")
	}
	a, err := s.store.Get(ctx, *job.AssetID)
	if errors.Is(err, ErrNotFound) {
		return nil // 照片已经删除，任务直接算完成
	}
	if err != nil {
		return err
	}

	tags, err := s.readExif(ctx, a.OriginalPath)
	if err != nil {
		return err
	}
	m, err := parseMetadata(tags)
	if err != nil {
		return err
	}
	if err := s.store.UpdateMetadata(ctx, a.ID, m); err != nil {
		return err
	}
	sortTime := a.FileMtime
	if m.TakenAt != nil {
		sortTime = *m.TakenAt
	}
	return jobs.Enqueue(ctx, s.db, jobs.NewJob{Type: JobThumbnail, AssetID: &a.ID, Priority: timelinePriority(sortTime)})
}

// readExif 用常驻的 exiftool 进程读取所有标签。
func (s *Service) readExif(ctx context.Context, path string) (map[string]any, error) {
	out, err := s.exif.Run(ctx, path)
	if err != nil {
		return nil, err
	}
	var list []map[string]any
	if err := json.Unmarshal(out, &list); err != nil {
		return nil, fmt.Errorf("解析 exiftool 输出: %w", err)
	}
	if len(list) == 0 {
		return nil, errors.New("exiftool 没有返回结果")
	}
	return list[0], nil
}

func parseMetadata(tags map[string]any) (Metadata, error) {
	var m Metadata

	w, okW := firstNumber(tags, "ImageWidth", "ExifImageWidth")
	h, okH := firstNumber(tags, "ImageHeight", "ExifImageHeight")
	if okW && okH {
		width, height := int(w), int(h)
		// 照片 Orientation 5–8、视频 Rotation 90/270 表示画面要转 90 度显示，宽高互换
		if o, ok := firstNumber(tags, "Orientation"); ok && o >= 5 && o <= 8 {
			width, height = height, width
		} else if r, ok := firstNumber(tags, "Rotation"); ok && (r == 90 || r == 270) {
			width, height = height, width
		}
		m.Width, m.Height = &width, &height
	}

	if d, ok := firstNumber(tags, "Duration"); ok && d > 0 {
		ms := int(math.Round(d * 1000))
		m.DurationMs = &ms
	}

	m.TakenAt = takenAt(tags)
	m.Latitude, m.Longitude = gps(tags)

	delete(tags, "SourceFile") // 磁盘路径不放进元数据
	exif, err := json.Marshal(tags)
	if err != nil {
		return m, err
	}
	m.Exif = exif
	return m, nil
}

// takenAt 按优先级找拍摄时间。照片的 EXIF 时间通常没有时区，有 OffsetTime 就用它，否则按服务器本地时区。
func takenAt(tags map[string]any) *time.Time {
	for _, key := range []string{"SubSecDateTimeOriginal", "DateTimeOriginal", "CreateDate", "MediaCreateDate"} {
		s, ok := tags[key].(string)
		if !ok {
			continue
		}
		if offset, ok := firstString(tags, "OffsetTimeOriginal", "OffsetTime"); ok && !hasZone(s) {
			s += offset
		}
		if t, ok := parseExifTime(s); ok {
			return &t
		}
	}
	return nil
}

var exifTimeLayouts = []string{
	"2006:01:02 15:04:05.999999999Z07:00",
	"2006:01:02 15:04:05Z07:00",
	"2006:01:02 15:04:05.999999999",
	"2006:01:02 15:04:05",
}

// 有些软件（例如美图秀秀）会把上午/下午写进 EXIF 时间，例如 "2025:06:24 10:03:07上午"，
// 也有写成英文 AM/PM 的。
var meridiemRe = regexp.MustCompile(`\s*(上午|下午|(?i:am|pm))`)

func parseExifTime(s string) (time.Time, bool) {
	s = strings.TrimSpace(s)
	if s == "" || strings.HasPrefix(s, "0000") {
		return time.Time{}, false
	}

	// 先去掉上午/下午标记按 24 小时制解析，再换算：下午 1–11 点加 12 小时，上午 12 点是 0 点
	var am, pm bool
	if m := meridiemRe.FindString(s); m != "" {
		mark := strings.ToLower(strings.TrimSpace(m))
		pm = mark == "下午" || mark == "pm"
		am = !pm
		s = strings.Replace(s, m, "", 1)
	}

	for _, layout := range exifTimeLayouts {
		t, err := time.ParseInLocation(layout, s, time.Local)
		if err != nil {
			continue
		}
		hour := t.Hour()
		switch {
		case pm && hour < 12:
			hour += 12
		case am && hour == 12:
			hour = 0
		}
		// 用 time.Date 重新组装而不是加减时长，避免夏令时切换当天差一小时
		return time.Date(t.Year(), t.Month(), t.Day(), hour, t.Minute(), t.Second(), t.Nanosecond(), t.Location()), true
	}
	return time.Time{}, false
}

// hasZone 判断时间字符串末尾是否已经带了时区（Z 或 ±hh:mm）。
func hasZone(s string) bool {
	if strings.HasSuffix(s, "Z") {
		return true
	}
	if len(s) < 6 {
		return false
	}
	tail := s[len(s)-6:]
	return (tail[0] == '+' || tail[0] == '-') && tail[3] == ':'
}

// gps 读取经纬度。照片用 GPSLatitude/GPSLongitude，iPhone 视频用 GPSCoordinates（"纬度 经度 海拔"）。
func gps(tags map[string]any) (*float64, *float64) {
	lat, okLat := firstNumber(tags, "GPSLatitude")
	lon, okLon := firstNumber(tags, "GPSLongitude")
	if !okLat || !okLon {
		s, ok := tags["GPSCoordinates"].(string)
		if !ok {
			return nil, nil
		}
		f := strings.Fields(s)
		if len(f) < 2 {
			return nil, nil
		}
		var err1, err2 error
		lat, err1 = strconv.ParseFloat(f[0], 64)
		lon, err2 = strconv.ParseFloat(f[1], 64)
		if err1 != nil || err2 != nil {
			return nil, nil
		}
	}
	if lat < -90 || lat > 90 || lon < -180 || lon > 180 || (lat == 0 && lon == 0) {
		return nil, nil
	}
	return &lat, &lon
}

func firstNumber(tags map[string]any, keys ...string) (float64, bool) {
	for _, k := range keys {
		switch v := tags[k].(type) {
		case float64:
			return v, true
		case string:
			if f, err := strconv.ParseFloat(v, 64); err == nil {
				return f, true
			}
		}
	}
	return 0, false
}

func firstString(tags map[string]any, keys ...string) (string, bool) {
	for _, k := range keys {
		if v, ok := tags[k].(string); ok && v != "" {
			return v, true
		}
	}
	return "", false
}
