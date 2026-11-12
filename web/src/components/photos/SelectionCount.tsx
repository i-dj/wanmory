import { type Asset, thumbnailUrl } from '@/lib/api'
import Tooltip from '@/components/ui/Tooltip'
import { t } from '@/i18n'

// SelectionCount 是工具栏最右边的「已选 3 项」，后面叠着最后选中的几张缩略图，和 macOS「照片」一样。
export default function SelectionCount({ assets }: { assets: Asset[] }) {
  const stack = assets.filter((a) => a.has_thumbnail).slice(-3) // 最多叠三张，最后一张在最上面
  return (
    <Tooltip label={t('按 Esc 取消选择')}>
      <div className="flex items-center gap-2.5">
        <span className="text-body whitespace-nowrap tabular-nums">{t('已选 {n} 项', { n: assets.length })}</span>
        {stack.length > 0 && (
          <span className="relative size-7 shrink-0">
            {stack.map((a, i) => {
              const depth = stack.length - 1 - i // 0 是最上面那张
              return (
                <img
                  key={a.id}
                  src={thumbnailUrl(a)}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 size-full rounded-sm object-cover ring-1 ring-page"
                  style={{
                    transform: `translate(${depth * 3}px, ${-depth * 3}px) scale(${1 - depth * 0.1})`,
                    zIndex: 3 - depth,
                  }}
                />
              )
            })}
          </span>
        )}
      </div>
    </Tooltip>
  )
}
