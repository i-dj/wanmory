import { t } from '@/i18n'
// 代替浏览器自带的 alert()、confirm()（那个是系统样式，和页面不搭）。不在组件里也能调用；AlertHost 挂在最外层，负责显示。
// 确认框（askConfirm）居中弹出，一次一个，后来的排在后面；提示（showAlert、showError）在左下角

export type AlertTone = 'danger' | 'warn' | 'info'

export interface AlertRequest {
  tone: AlertTone
  title: string
  message?: string
  confirmLabel: string
  cancelLabel: string
  resolve: (ok: boolean) => void
}

let queue: AlertRequest[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function subscribeAlerts(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export const currentAlert = () => queue[0] ?? null

// closeAlert 关掉现在这个，显示下一个
export function closeAlert(ok: boolean) {
  const [first, ...rest] = queue
  if (!first) return
  queue = rest
  emit()
  first.resolve(ok)
}

function push(r: Omit<AlertRequest, 'resolve'>) {
  return new Promise<boolean>((resolve) => {
    queue = [...queue, { ...r, resolve }]
    emit()
  })
}

// 提示（出错、不支持之类）不弹框，显示在左下角，和上传窗口一个样子，几秒后自己消失
export interface Notice {
  id: number
  tone: AlertTone
  title: string
  detail?: string
  leaving?: boolean // 正在播放离开的动画，播完 removeNotice 拿掉
}
let notices: Notice[] = []
let nextNotice = 1
const noticeListeners = new Set<() => void>()
const emitNotices = () => noticeListeners.forEach((l) => l())

export function subscribeNotices(listener: () => void) {
  noticeListeners.add(listener)
  return () => {
    noticeListeners.delete(listener)
  }
}
export const currentNotices = () => notices

// dismissNotice 关掉一条：先播离开的动画，播完卡片自己调 removeNotice
export function dismissNotice(id: number) {
  notices = notices.map((n) => (n.id === id ? { ...n, leaving: true } : n))
  emitNotices()
}
export function removeNotice(id: number) {
  notices = notices.filter((n) => n.id !== id)
  emitNotices()
}

// showAlert 在左下角显示一句提示；同一句话还在显示时不重复加
export function showAlert(title: string, detail?: string, tone: AlertTone = 'info') {
  if (notices.some((n) => !n.leaving && n.title === title && n.detail === detail)) return
  notices = [...notices.slice(-2), { id: nextNotice++, tone, title, detail }] // 最多同时三条
  emitNotices()
}

// showError 是出错的提示：只显示服务器给的原因，一句话（例如「只能隐藏自己上传的照片」），带警告图标。
// title 说哪件事没做成，只在服务器没给原因时显示
export function showError(title: string, err: unknown) {
  const reason = err instanceof Error ? err.message : String(err ?? '')
  showAlert(reason || title, undefined, 'warn')
}

// askConfirm 问一句要不要做，确定返回 true。danger 时确定按钮是红的（删除、取消上传这种）
export function askConfirm(
  title: string,
  { message, confirmLabel = t('确定'), danger }: { message?: string; confirmLabel?: string; danger?: boolean } = {},
) {
  return push({ tone: danger ? 'danger' : 'warn', title, message, confirmLabel, cancelLabel: t('取消') })
}

// askDelete 是通用的「删除对话框」：上面红色圆圈里一个感叹号，标题「删除「…」？」，下面一行说明删了会怎样，
// 左边「取消」、右边红色的「删除」。确定删除返回 true。删成员、删相册、删模型……都用它，样子一样
export function askDelete(title: string, message?: string) {
  return askConfirm(title, { message, confirmLabel: t('删除'), danger: true })
}
