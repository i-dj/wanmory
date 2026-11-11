# 提交问题服务端（Cloudflare Worker）

官网 `/feedback/` 页面的服务端：接收表单，校验人机验证（Cloudflare Turnstile）和提交频率，用 GitHub 令牌在仓库里创建 Issue。
令牌只保存在 Worker 的密钥里，网页代码里没有。

没有部署这个服务时，`/feedback/` 会退回到「打开 GitHub 新建 Issue 页面并自动填好内容」的方式，照常可用。

## 1. 创建 GitHub 令牌

GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token：

- Repository access：**Only select repositories**，只选 `i-dj/wanmory`
- Permissions → Repository permissions → **Issues：Read and write**（其他保持 No access）
- 设置一个过期时间，到期前更新

建议用一个单独的机器人账号创建令牌，Issue 的作者会显示为这个账号。

## 2. 创建 Turnstile 人机验证

Cloudflare 控制台 → Turnstile → Add widget：

- Domain：`wanmory.com`（本地调试再加 `localhost`）
- Widget mode：Managed

记下 **Site Key**（给网页用）和 **Secret Key**（给 Worker 用）。

## 3. 部署 Worker

在 `website/worker` 目录：

```bash
npx wrangler login
npx wrangler secret put GITHUB_TOKEN        # 粘贴第 1 步的令牌
npx wrangler secret put TURNSTILE_SECRET    # 粘贴第 2 步的 Secret Key
npx wrangler deploy
```

部署后得到地址，形如 `https://wanmory-feedback.<子域>.workers.dev`（也可以在 Cloudflare 里绑定 `api.wanmory.com` 这样的自定义域名）。

可选：开启按 IP 限频（默认每小时 5 次，在 `wrangler.toml` 的 `RATE_LIMIT_PER_HOUR` 改）：

```bash
npx wrangler kv namespace create RATE
```

把输出的 `id` 填进 `wrangler.toml` 里 `[[kv_namespaces]]` 那一段并去掉注释，再 `npx wrangler deploy`。

`wrangler.toml` 里的 `ALLOWED_ORIGINS` 是允许调用的网页来源，官网域名变了要同步修改。

## 4. 让官网启用直接提交

构建官网时设置两个环境变量（本地可以写进 `website/.env.local`，格式见 `website/.env.example`）：

```bash
VITE_FEEDBACK_API=https://wanmory-feedback.<子域>.workers.dev
VITE_TURNSTILE_SITE_KEY=<第 2 步的 Site Key>
```

然后重新 `npm run build`。两个变量都设置了才启用直接提交；任何一步出错，页面都会提示，并可以改用 GitHub 提交。

## 接口

`POST /issues`，JSON：

| 字段 | 说明 |
| --- | --- |
| `kind` | `bug` / `feature` / `question`，标题会加上 `[Bug]` / `[建议]` / `[咨询]` |
| `title` | 标题，1–120 字 |
| `body` | 正文（Markdown），最多 20000 字 |
| `github` | 选填，提交人的 GitHub 用户名，Issue 末尾会 @ 他 |
| `token` | Turnstile 返回的验证 token |
| `website` | 诱饵字段，必须为空 |

成功返回 `201 {"ok": true, "number": 42, "url": "https://github.com/…/issues/42"}`；失败返回 `{"error": "原因"}`，状态码 400 / 403 / 429 / 502。
