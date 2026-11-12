import { t } from '@/i18n'
import { type Asset, originalUrl } from '@/lib/api'
import { askConfirm, showAlert, showError } from '@/lib/dialog'

// 分享：把选中的照片、视频取下来，交给系统的分享面板（隔空投送、邮件、信息、微信……），
// 选「邮件」就新建一封邮件，文件已经在附件里。网页不能直接往邮件里放附件（mailto 不支持），只能走系统分享面板。
// 哪里有系统分享面板：macOS 和 iOS 的 Safari、Chrome；Windows 10/11 的 Chrome、Edge；Android 的浏览器。
// Firefox、Linux 上的浏览器没有。
// 照片：JPEG / PNG / GIF 且不超过 8 MB 用原图；HEIC、RAW、太大的用 2560 像素的 JPEG 大图（收件人都能打开，邮件也不会太大）。
// 视频用原文件。
// 系统分享面板只在 HTTPS 或 localhost 打开的页面里能用；用局域网 IP（http://192.168…）打开时浏览器不给。
// 用不了时改成下载这些文件，并说明原因

const EMAILABLE = new Set(['image/jpeg', 'image/png', 'image/gif'])
const MAX_ORIGINAL = 8 << 20

function source(a: Asset): { url: string; name: string } {
  if (a.type === 'video' || (EMAILABLE.has(a.mime_type) && a.file_size <= MAX_ORIGINAL)) {
    return { url: originalUrl(a), name: a.file_name }
  }
  return { url: `/api/assets/${a.id}/large`, name: a.file_name.replace(/\.[^.]*$/, '') + '.jpg' }
}

// 同名文件加上 (2)、(3)，不然邮件里只剩一个
function uniqueNames(list: { url: string; name: string }[]) {
  const seen = new Map<string, number>()
  return list.map((f) => {
    const n = (seen.get(f.name) ?? 0) + 1
    seen.set(f.name, n)
    return n === 1 ? f : { ...f, name: f.name.replace(/(\.[^.]*)?$/, ` (${n})$1`) }
  })
}

export const canShareFiles = () =>
  typeof navigator.canShare === 'function' &&
  navigator.canShare({ files: [new File([''], 'a.jpg', { type: 'image/jpeg' })] })

export async function shareAssets(assets: Asset[], onDownload: () => void) {
  if (!canShareFiles()) {
    // 不能用系统分享面板：下载文件，告诉用户为什么
    onDownload()
    showAlert(
      t('已改为下载'),
      isSecureContext
        ? t('这个浏览器不支持系统分享，文件已下载，可以自己添加到邮件或聊天里。')
        : t('用 https 或 localhost 打开相册才能使用系统分享。文件已下载，可以自己添加到邮件或聊天里。'),
    )
    return
  }
  let files: File[]
  try {
    files = await Promise.all(
      uniqueNames(assets.map(source)).map(async ({ url, name }) => {
        const res = await fetch(url)
        if (!res.ok) throw new Error(t('读取文件失败（{status}）', { status: res.status }))
        const blob = await res.blob()
        return new File([blob], name, { type: blob.type })
      }),
    )
  } catch (e) {
    return showError(t('没有准备好附件'), e)
  }
  const share = () => navigator.share({ files })
  try {
    await share()
  } catch (e) {
    const err = e as DOMException
    if (err.name === 'AbortError') return // 用户关了分享面板
    if (err.name !== 'NotAllowedError') return showError(t('没有分享成功'), e)
    // 文件取得久了，浏览器认为不是用户刚点的，要再点一下
    if (!(await askConfirm(t('附件已准备好'), { confirmLabel: t('分享') }))) return
    await share().catch((e2: DOMException) => e2.name !== 'AbortError' && showError(t('没有分享成功'), e2))
  }
}
