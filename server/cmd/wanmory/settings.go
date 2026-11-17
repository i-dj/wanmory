package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"strconv"

	"github.com/wanmory/wanmory/server/internal/assets"
	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/config"
	"github.com/wanmory/wanmory/server/internal/faces"
	"github.com/wanmory/wanmory/server/internal/netaccess"
	"github.com/wanmory/wanmory/server/internal/settings"
	"github.com/wanmory/wanmory/server/internal/storage"
)

// newSettingsRegistry 登记网页设置页上能修改的设置项，按这里的顺序显示。
func newSettingsRegistry(cfg config.Config, roots storage.Roots) *settings.Registry {
	r := settings.NewRegistry()

	r.Register(settings.Def{
		Key:         assets.SettingUploadDir,
		Label:       "上传目录",
		Description: "按年月保存上传文件，修改后仅影响新上传的文件。",
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
		Key:         faces.SettingMinPhotos,
		Label:       "新建人物的门槛",
		Description: "同一个人至少出现在几张照片里，才在「人物」里单独列出来。改大后，照片不够数、没起名字的人物会拆掉。",
		Kind:        settings.KindChoice,
		Default:     strconv.Itoa(faces.DefaultMinPhotos),
		Choices: []settings.Choice{
			{Value: "2", Label: "2 张照片", Hint: "认得最全，偶尔出现的人也会列出来"},
			{Value: "3", Label: "3 张照片", Hint: "大多数路人不会列出来"},
			{Value: "5", Label: "5 张照片", Hint: "只列常出现的人"},
			{Value: "10", Label: "10 张照片", Hint: "只列经常出现的人"},
		},
	})

	r.Register(settings.Def{
		Key:         auth.SettingGuest,
		Label:       "访客浏览",
		Description: "允许未登录用户浏览共享内容，私有相册和隐藏照片不可见。公网访问建议关闭。",
		Kind:        settings.KindChoice,
		Default:     "on",
		Choices: []settings.Choice{
			{Value: "on", Label: "打开", Hint: "没登录也能看共享的照片"},
			{Value: "off", Label: "关闭", Hint: "必须登录才能看"},
		},
	})

	r.Register(settings.Def{
		Key:         "maps.online",
		Label:       "在线地图",
		Description: "显示地图、地名和地点搜索，会向地图服务发送照片位置。关闭后仅显示坐标。",
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
		Description: "",
		Kind:        settings.KindChoice,
		Default:     "auto",
		Choices: []settings.Choice{
			{Value: "auto", Label: "自动", Hint: "中国大陆用高德，其他地区用 OpenStreetMap"},
			{Value: "amap", Label: "高德", Hint: "全部用高德，人在国内、OpenStreetMap 打不开时选它"},
			{Value: "osm", Label: "OpenStreetMap", Hint: "全部用 OpenStreetMap，海外地图更详细"},
		},
	})

	r.Register(settings.Def{
		Key:         netaccess.SettingDomain,
		Label:       "访问域名",
		Description: "在局域网里访问相册的网址，必须以 .local 结尾，也可以通过 IP 来访问。",
		Kind:        settings.KindText,
		Default:     netaccess.InitialDomain(),
		Validate: func(ctx context.Context, raw json.RawMessage) (any, error) {
			var v string
			if err := json.Unmarshal(raw, &v); err != nil {
				return nil, fmt.Errorf("%w：应该是域名", settings.ErrInvalid)
			}
			d, err := netaccess.CheckDomain(v)
			if err != nil {
				return nil, fmt.Errorf("%w：%v", settings.ErrInvalid, err)
			}
			return d, nil
		},
	})

	return r
}
