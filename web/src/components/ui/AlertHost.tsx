import { CircleAlert, Info, type LucideIcon, TriangleAlert, X } from 'lucide-react'
import { useEffect, useSyncExternalStore } from 'react'
import DialogButton from '@/components/ui/DialogButton'
import Tooltip from '@/components/ui/Tooltip'
import { cx } from '@/lib/cx'
import {
  type AlertTone,
  closeAlert,
  currentAlert,
  currentNotices,
  dismissNotice,
  type Notice,
  removeNotice,
  subscribeAlerts,
  subscribeNotices,
} from '@/lib/dialog'
import { t } from '@/i18n'

const TONES: Record<AlertTone, { icon: LucideIcon; circle: string; bar: string }> = {
  danger: { icon: CircleAlert, circle: 'bg-danger/15 text-danger', bar: 'bg-danger' },
  warn: { icon: TriangleAlert, circle: 'bg-warn/15 text-warn', bar: 'bg-warn' },
  info: { icon: Info, circle: 'bg-accent/15 text-accent', bar: 'bg-accent' },
}

// 左下角的提示：和上传窗口、后台任务面板一样的浅色磨砂（index.css 的 .frost）
const GLASS = 'frost'

// AlertHost 显示 lib/dialog 里的东西：左下角的提示，和居中的确认框
export default function AlertHost() {
  return (
    <>
      <Notices />
      <ConfirmDialog />
    </>
  )
}

// Notices 是左下角的提示卡片，样子和上传窗口一样：左边圆形图标，中间一句话，右边关闭；
// 底下一条细进度条慢慢缩短，缩完自己消失。鼠标放上去时停住，看完再走。
// 出现时从左下角往上、略微放大地滑进来；离开时往左滑出、淡掉，同时这一格收起来
function Notices() {
  const notices = useSyncExternalStore(subscribeNotices, currentNotices)
  if (notices.length === 0) return null
  return (
    <div
      aria-live="polite"
      className="fixed inset-x-3 bottom-1 z-50 flex flex-col sm:right-auto sm:left-4 sm:w-95"
      data-keep-selection
    >
      {notices.map((n) => (
        <NoticeCard key={n.id} notice={n} />
      ))}
    </div>
  )
}

function NoticeCard({ notice }: { notice: Notice }) {
  const { icon: Icon, circle, bar } = TONES[notice.tone]
  // 外面两层是为了离开时收起这一格的高度，上面的卡片顺着滑下来，不是一下子掉下来；卡片之间的间距在里层（pb-2），跟着一起收
  return (
    <div className={cx('notice-slot', notice.leaving && 'notice-slot-leaving')}>
      <div className="min-h-0">
        <div className="pb-2">
          <div
            role="status"
            className={cx(
              'notice-card group relative overflow-hidden rounded-2xl',
              GLASS,
              notice.leaving && 'notice-leaving',
            )}
            onAnimationEnd={(e) => {
              if (e.animationName.startsWith('notice-out')) removeNotice(notice.id)
            }}
          >
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <span className={cx('flex size-10 shrink-0 items-center justify-center rounded-full', circle)}>
                <Icon className="size-5" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold">{notice.title}</p>
                {notice.detail && <p className="mt-0.5 text-caption text-muted">{notice.detail}</p>}
              </div>
              <Tooltip label={t('关闭')}>
                <button
                  type="button"
                  onClick={() => dismissNotice(notice.id)}
                  aria-label={t('关闭')}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-line hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              </Tooltip>
            </div>
            <div className="px-4 pb-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className={cx('notice-countdown h-full rounded-full', bar)}
                  onAnimationEnd={() => dismissNotice(notice.id)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ConfirmDialog 是居中的确认框：最上面一个带淡色光圈的圆形图标，下面标题、说明，最底下两个撑满宽度的按钮。
// 背后的页面模糊、压暗一点。Esc 或点遮罩等于取消
function ConfirmDialog() {
  const alert = useSyncExternalStore(subscribeAlerts, currentAlert)

  useEffect(() => {
    if (!alert) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation() // 别连带关掉后面的大图查看器、弹出层
        closeAlert(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [alert])

  if (!alert) return null
  const { icon: Icon, circle } = TONES[alert.tone]
  return (
    <div
      className="alert-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeAlert(false)
      }}
    >
      {/* 压暗、模糊的那层单独垫着，不加在外层上：外层带 backdrop-filter 时卡片自己的磨砂会失灵 */}
      <div aria-hidden="true" className="dialog-dim pointer-events-none absolute inset-0" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        aria-describedby={alert.message ? 'alert-message' : undefined}
        className="alert-card glass-dialog w-full max-w-[26rem] rounded-dialog px-6 pt-6 pb-5 text-center"
      >
        <div className={cx('mx-auto flex size-11 items-center justify-center rounded-full', circle)}>
          <Icon className="size-5.5" strokeWidth={2} />
        </div>
        <h2 id="alert-title" className="mt-4 text-heading font-semibold text-fg">
          {alert.title}
        </h2>
        {alert.message && (
          <p id="alert-message" className="mt-1.5 text-body text-muted">
            {alert.message}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <DialogButton onClick={() => closeAlert(false)}>{alert.cancelLabel}</DialogButton>
          <DialogButton
            autoFocus
            variant={alert.tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => closeAlert(true)}
          >
            {alert.confirmLabel}
          </DialogButton>
        </div>
      </div>
    </div>
  )
}
