// Package ai 调用 AI 服务（Python，见 ml/）。约定见仓库 README「AI 服务接口约定」。
//
// 图片一律随请求用 HTTP 发过去（multipart），不传文件路径：AI 服务常常在另一台机器上
// （家里的 Mac、带显卡的电脑、远程服务器），和后端不共用目录。发的是 1440 像素的预览图，不是原图。
package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"sync"
	"time"
)

// ErrUnavailable 表示连不上 AI 服务（没启动、网络断了）。调用方据此把任务留在队列里等它恢复，而不是算作失败
var ErrUnavailable = errors.New("AI 服务连不上")

type Client struct {
	mu    sync.RWMutex
	base  string
	token string
	http  *http.Client
}

// NewClient 连接 base（例如 http://127.0.0.1:3003）。token 不为空时每个请求带上 Authorization: Bearer
func NewClient(base, token string) *Client {
	return &Client{
		base:  strings.TrimRight(base, "/"),
		token: token,
		// 第一次请求时 AI 服务要下载、加载模型，可能要一两分钟
		http: &http.Client{Timeout: 3 * time.Minute},
	}
}

// SetEndpoint 换一个 AI 服务（网页设置里改了地址），之后的请求都发到新地址
func (c *Client) SetEndpoint(base, token string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.base = strings.TrimRight(base, "/")
	c.token = token
}

func (c *Client) endpoint() (string, string) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.base, c.token
}

func (c *Client) URL() string {
	base, _ := c.endpoint()
	return base
}

// Health 是 GET /health 的结果
type Health struct {
	Status    string   `json:"status"`
	Version   string   `json:"version"`
	Providers []string `json:"providers"` // 可用的硬件加速，例如 CoreMLExecutionProvider
}

func (c *Client) Health(ctx context.Context) (Health, error) {
	var h Health
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.URL()+"/health", nil)
	if err != nil {
		return h, err
	}
	err = c.do(req, &h)
	return h, err
}

// FaceTask 是 /predict 里人脸任务的参数
type FaceTask struct {
	Model    string  `json:"model,omitempty"`
	MinScore float64 `json:"min_score,omitempty"`
}

// ClipTask 是图片的语义向量
type ClipTask struct {
	Model string `json:"model,omitempty"`
}

// ClipTextTask 是几段文字的语义向量（搜索词、分类的描述），不用传图片
type ClipTextTask struct {
	Model string   `json:"model,omitempty"`
	Texts []string `json:"texts"`
}

// OCRTask 是认出图片里的字
type OCRTask struct{}

// Tasks 是一次 /predict 要做的任务，为空的不做
type Tasks struct {
	Face     *FaceTask     `json:"face,omitempty"`
	Clip     *ClipTask     `json:"clip,omitempty"`
	ClipText *ClipTextTask `json:"clip.text,omitempty"`
	OCR      *OCRTask      `json:"ocr,omitempty"`
}

// Face 是 AI 服务找到的一张脸
type Face struct {
	Box       [4]float64   `json:"box"` // x, y, w, h，图片像素
	Score     float64      `json:"score"`
	Landmarks [][2]float64 `json:"landmarks"` // 两眼、鼻尖、两嘴角
	Embedding []float32    `json:"embedding"` // 长度为 1，点积就是余弦相似度
	Blur      float64      `json:"blur"`      // 对齐后人脸的拉普拉斯方差，越小越模糊
	Yaw       float64      `json:"yaw"`       // 左右转头程度，0 是正脸
}

// Prediction 是 /predict 的结果
type Prediction struct {
	Image struct {
		Width  int `json:"width"`
		Height int `json:"height"`
	} `json:"image"`
	Face []Face `json:"face"`
	Clip *struct {
		Embedding []float32 `json:"embedding"` // 长度为 1
	} `json:"clip"`
	ClipText *struct {
		Embeddings [][]float32 `json:"embeddings"` // 和 Texts 一样的顺序
	} `json:"clip.text"`
	OCR *struct {
		Text string `json:"text"` // 一行一个换行，按从上到下排
	} `json:"ocr"`
	ModelIDs map[string]string `json:"model_ids"` // 每个任务实际用的模型，后端核对，不一致的结果不用
}

// Predict 把图片（JPEG 等）发给 AI 服务做 tasks 里的任务。只算文字向量时 image 传 nil
func (c *Client) Predict(ctx context.Context, image []byte, name string, tasks Tasks) (*Prediction, error) {
	var body bytes.Buffer
	form := multipart.NewWriter(&body)
	if image != nil {
		part, err := form.CreateFormFile("image", name)
		if err != nil {
			return nil, err
		}
		if _, err := part.Write(image); err != nil {
			return nil, err
		}
	}
	spec, err := json.Marshal(tasks)
	if err != nil {
		return nil, err
	}
	if err := form.WriteField("tasks", string(spec)); err != nil {
		return nil, err
	}
	if err := form.Close(); err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.URL()+"/predict", &body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", form.FormDataContentType())
	var p Prediction
	if err := c.do(req, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

// Call 发一个 JSON 请求（body 为 nil 时不带请求体），回答解析到 out，设置页的管理接口用
func (c *Client) Call(ctx context.Context, method, path string, body, out any) error {
	var r io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}
		r = bytes.NewReader(b)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.URL()+path, r)
	if err != nil {
		return err
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	return c.do(req, out)
}

func (c *Client) do(req *http.Request, out any) error {
	base, token := c.endpoint()
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := c.http.Do(req)
	if err != nil {
		if req.Context().Err() != nil {
			return err
		}
		return fmt.Errorf("%w（%s）: %v", ErrUnavailable, base, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		msg, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		if resp.StatusCode == http.StatusBadGateway || resp.StatusCode == http.StatusServiceUnavailable ||
			resp.StatusCode == http.StatusGatewayTimeout {
			return fmt.Errorf("%w：%s %s", ErrUnavailable, resp.Status, strings.TrimSpace(string(msg)))
		}
		return fmt.Errorf("AI 服务返回 %s: %s", resp.Status, strings.TrimSpace(string(msg)))
	}
	return json.NewDecoder(resp.Body).Decode(out)
}
