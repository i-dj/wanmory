import { locale, t } from '@/i18n'

// 服务器回给网页的中文提示，换成当前语言。
// 大多数提示 scripts/i18n.mjs 能从 Go 代码里自动找到（httpx.Error、errors.New 里的固定句子），
// 这里补它找不到的：写在常量里的、拼了数字的（fmt.Sprintf）、后面接着具体原因的。
// st() 原样返回，只是给 scripts/i18n.mjs 做记号，把这些句子收进翻译表

const st = (s: string) => s

// 写在常量、变量里的固定句子
st('演示账号禁止此项操作')
st('这个名字已经有人用了')
st('服务器内部错误')
st('登录已过期，请重新登录')
st('有照片正在上传')
st('正在生成缩略图')
st('AI 模型还没下载，在「系统设置 → AI 设置」里下载后开始')
st('保存照片失败')

// 设置页的系统设置项（server/cmd/wanmory/settings.go 里的名字、说明、选项）
st('上传目录')
st('按年月保存上传文件，修改后仅影响新上传的文件。')
st('访客浏览')
st('允许未登录用户浏览共享内容，私有相册和隐藏照片不可见。公网访问建议关闭。')
st('没登录也能看共享的照片')
st('必须登录才能看')
st('在线地图')
st('显示地图、地名和地点搜索，会向地图服务发送照片位置。关闭后仅显示坐标。')
st('显示地图和地名')
st('不向外发送位置，只显示坐标')
st('地图来源')
st('自动')
st('中国大陆用高德，其他地区用 OpenStreetMap')
st('高德')
st('全部用高德，人在国内、OpenStreetMap 打不开时选它')
st('全部用 OpenStreetMap，海外地图更详细')
st('访问域名')
st('在局域网里访问相册的网址，必须以 .local 结尾，也可以通过 IP 来访问。')

// AI 模型的名字（ml/wanmory_ml/models.py，例如「语义搜索 · 高精度（H/14）」），按词换
st('人脸识别')
st('语义搜索')
st('高精度')
st('标准')
st('均衡')
st('轻量')

// 带数字的句子：{n} 对应服务器那句里的一个数字；{detail} 是句末接着的具体原因（原样显示）
const TEMPLATES = [
  st('密码至少 {n} 位'),
  st('名字要 1 到 {n} 个字'),
  st('密码输错的次数太多了，请 {n} 分钟后再试'),
  st('说明最多 {n} 个字'),
  st('地名最多 {n} 个字'),
  st('一次要选 1 到 {n} 张'),
  st('同时处理的任务数应该是 0（自动）到 {n}'),
  st('等到 {n}:00 再处理'),
  st('刚传完照片，{n} 秒后开始'),
  st('刚传完照片，{n} 分钟后开始'),
  st('AI 服务版本太旧，更新后才能在这里设置：{detail}'),
  st('连不上 GitHub，检查不了更新：{detail}'),
]

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const keepChinese = () => locale() === 'zh-CN'

// choiceLabel：设置选项的名字。「打开」「关闭」在别处是打开、关闭窗口的意思，开关上要换成「开」「关」那两句
export const choiceLabel = (label: string) =>
  keepChinese() ? label : label === '打开' ? t('已开启') : label === '关闭' ? t('已关闭') : serverText(label)

// modelLabel：AI 模型名字里的中文词逐个换掉，「语义搜索 · 高精度（H/14）」→「Semantic search · High quality（H/14）」
export const modelLabel = (label: string) => label.replace(/[\u4e00-\u9fff]+/g, (w) => t(w))

let compiled: { src: string; re: RegExp; names: string[] }[] | null = null

// serverText：翻译表里有这一句就直接换；没有就看是不是上面带数字的句子之一，套进去换
export function serverText(msg: string): string {
  if (t(msg) !== msg) return t(msg)
  compiled ??= TEMPLATES.map((src) => {
    const names: string[] = []
    const body = src
      .split(/(\{\w+\})/)
      .map((part) => {
        const m = /^\{(\w+)\}$/.exec(part)
        if (!m) return escape(part)
        names.push(m[1])
        return m[1] === 'n' ? '(\\d+)' : '([\\s\\S]*)'
      })
      .join('')
    return { src, re: new RegExp(`^${body}$`), names }
  })
  for (const { src, re, names } of compiled) {
    const m = re.exec(msg)
    if (!m) continue
    const vars: Record<string, unknown> = {}
    names.forEach((name, i) => (vars[name] = name === 'n' ? Number(m[i + 1]) : m[i + 1]))
    return t(src, vars)
  }
  return msg
}
