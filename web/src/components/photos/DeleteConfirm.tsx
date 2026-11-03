import DialogButton from '@/components/ui/DialogButton'
import { Trash2 } from 'lucide-react'
import type { Asset } from '@/lib/api'
import { cx } from '@/lib/cx'
import DeleteIllustration from './DeleteIllustration'

// DeleteConfirm 是删除按钮下面弹出的确认卡片：上面一幅「手拿照片扔进垃圾桶」的线条漫画，
// 手里拿的就是选中的照片；下面一句标题、一句说明，最后两个一样宽的按钮。
// permanent 是「最近删除」里的永久删除：说清楚删了就找不回来。
// 关闭（点外面、Esc）由外面的 DeleteButton 管；删除按钮默认有焦点，回车就是确认。
export default function DeleteConfirm({
  assets,
  total,
  permanent,
  align = 'center',
  onConfirm,
  onClose,
}: {
  assets: Asset[] // 要删除的照片（全部删除时是已经加载的那些，漫画里用）
  total?: number // 一共几张：全部删除时还有没加载的，按这个数说
  permanent?: boolean
  align?: 'center' | 'end' // end：右边和按钮对齐，按钮靠近窗口右边时用
  onConfirm: () => void
  onClose: () => void
}) {
  const photos = assets.filter((a) => a.type !== 'video').length
  const videos = assets.length - photos
  // 只有照片或只有视频时写清是哪种，混在一起就只说几项，标题短一点
  const what =
    total !== undefined
      ? `全部 ${total.toLocaleString()} 项`
      : videos === 0
        ? `${photos} 张照片`
        : photos === 0
          ? `${videos} 个视频`
          : `${assets.length} 项`

  return (
    <div
      role="dialog"
      aria-labelledby="delete-title"
      className={cx(
        'popover-card glass-menu absolute top-11 z-40 w-75 rounded-dialog text-center shadow-2xl',
        align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0',
      )}
    >
      {/* 指向删除按钮的小尖角 */}
      <span
        className={cx(
          'absolute -top-1.5 size-3 rotate-45 border-t border-l border-line bg-surface',
          align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-6',
        )}
      />

      <div className="rounded-t-dialog bg-linear-to-b from-danger/12 to-transparent px-5 pt-5">
        <DeleteIllustration assets={assets} />
      </div>

      <div className="px-5 pt-2 pb-5">
        <h2 id="delete-title" className="text-heading font-semibold">
          {permanent ? '永久删除' : '删除'} {what}？
        </h2>
        <p className="mt-1 text-caption text-muted">
          {permanent ? '原始文件也会从磁盘上删除，无法恢复' : '可在「最近删除」中恢复'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <DialogButton onClick={onClose}>取消</DialogButton>
          <DialogButton
            variant="danger"
            icon={Trash2}
            autoFocus
            onClick={() => {
              onClose()
              onConfirm()
            }}
          >
            {permanent ? '永久删除' : '删除'}
          </DialogButton>
        </div>
      </div>
    </div>
  )
}
