package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"

	"github.com/wanmory/wanmory/server/internal/assets"
	"github.com/wanmory/wanmory/server/internal/config"
	"github.com/wanmory/wanmory/server/internal/settings"
	"github.com/wanmory/wanmory/server/internal/storage"
)

// newSettingsRegistry 登记网页设置页上能修改的设置项，按这里的顺序显示。
func newSettingsRegistry(cfg config.Config, roots storage.Roots) *settings.Registry {
	r := settings.NewRegistry()

	r.Register(settings.Def{
		Key:         assets.SettingUploadDir,
		Label:       "上传目录",
		Description: "网页上传的照片和视频保存在这里，按年月分子目录。修改后只影响之后上传的文件。",
		Kind:        settings.KindPath,
		Default:     cfg.UploadDir,
		Validate: func(ctx context.Context, raw json.RawMessage) (any, error) {
			var p string
			if err := json.Unmarshal(raw, &p); err != nil || p == "" {
				return nil, fmt.Errorf("%w：应该是目录路径", settings.ErrInvalid)
			}
			resolved, err := roots.CheckWritableDir(p)
			if errors.Is(err, storage.ErrOutside) {
				return nil, fmt.Errorf("%w：%v", settings.ErrInvalid, err)
			}
			if errors.Is(err, fs.ErrNotExist) {
				return nil, fmt.Errorf("%w：目录不存在", settings.ErrInvalid)
			}
			if err != nil {
				return nil, fmt.Errorf("%w：%v", settings.ErrInvalid, err)
			}
			return resolved, nil
		},
	})

	r.Register(settings.Def{
		Key:         "maps.online",
		Label:       "在线地图",
		Description: "照片信息里用 OpenStreetMap 显示地图、地名和搜索地点。打开时会把照片的大致位置发给 OpenStreetMap 的服务器；关掉后只显示坐标。",
		Kind:        settings.KindChoice,
		Default:     "on",
		Choices: []settings.Choice{
			{Value: "on", Label: "打开", Hint: "显示地图和地名"},
			{Value: "off", Label: "关闭", Hint: "不向外发送位置，只显示坐标"},
		},
	})

	r.Register(settings.Def{
		Key:         "maps.source",
		Label:       "地图来源",
		Description: "在线地图用哪家的底图。OpenStreetMap 在中国大陆打开很慢或打不开；高德在国内快，但海外只有简略的地图。自动：看的地方在中国大陆就用高德，其他地方用 OpenStreetMap。",
		Kind:        settings.KindChoice,
		Default:     "auto",
		Choices: []settings.Choice{
			{Value: "auto", Label: "自动", Hint: "国内用高德，海外用 OpenStreetMap"},
			{Value: "amap", Label: "高德", Hint: "全部用高德，人在国内、OpenStreetMap 打不开时选它"},
			{Value: "osm", Label: "OpenStreetMap", Hint: "全部用 OpenStreetMap，海外地图更详细"},
		},
	})

	return r
}
