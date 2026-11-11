import DialogButton from '@/components/ui/DialogButton'
import { Image, Lock, Trash2 } from 'lucide-react'
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
  blocked,
  onConfirm,
  onClose,
}: {
  assets: Asset[] // 要删除的照片（全部删除时是已经加载的那些，漫画里用）
  total?: number // 一共几张：全部删除时还有没加载的，按这个数说
  permanent?: boolean
  align?: 'center' | 'end' // end：右边和按钮对齐，按钮靠近窗口右边时用
  blocked?: boolean // 成员选了别人传的照片：换成「照片加锁」的图标、说明和一个「知道了」，没有删除按钮
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
        'popover-card glass-menu absolute top-11 z-40 w-75 rounded-dialog text-center',
        align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0',
      )}
    >

      {blocked ? (
        <div className="px-5 pt-5 pb-4">
          {/* 照片加一把小锁：说明这张不归你删 */}
          <div className="relative mx-auto grid size-13 place-items-center rounded-2xl bg-fg/[0.08]">
            <Image className="size-7 text-fg/85" strokeWidth={1.5} />
            <span className="absolute right-2 bottom-2 grid size-4.5 place-items-center rounded-[5px] bg-rose-300 ring-2 ring-surface">
              <Lock className="size-3 text-black/75" strokeWidth={2.4} />
            </span>
          </div>
          <h2 id="delete-title" className="mt-3 text-heading font-semibold">
            {assets.length > 1 ? '无法删除所选内容' : videos ? '无法删除此视频' : '无法删除此照片'}
          </h2>
          <p className="mt-1.5 text-body leading-relaxed text-muted">
            只能删除自己上传的内容。
            <br />
            如需删除，请联系管理员。
          </p>
          <div className="mt-4 grid">
            <DialogButton onClick={onClose} autoFocus>
              知道了
            </DialogButton>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-t-dialog bg-linear-to-b from-danger/12 to-transparent px-5 pt-5">
            <DeleteIllustration assets={assets} />
          </div>

          <div className="px-5 pt-2 pb-5">
            <h2 id="delete-title" className="text-heading font-semibold">
              {`${permanent ? '永久删除' : '删除'} ${what}？`}
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
        </>
      )}
    </div>
  )
}
