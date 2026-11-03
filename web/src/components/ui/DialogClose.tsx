import { X } from 'lucide-react'
import { cx } from '@/lib/cx'

// DialogClose 是弹出窗口右上角的「×」：圆形，鼠标移上去淡淡一圈底色。
// 放在对话框卡片里（卡片要是 relative，glass-dialog 本来就是），绝对定位在右上角
export default function DialogClose({ onClose, className }: { onClose: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label="关闭"
      onClick={onClose}
      className={cx(
        'absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-fg/[0.07] hover:text-fg',
        className,
      )}
    >
      <X className="size-4.5" strokeWidth={2} />
    </button>
  )
}
