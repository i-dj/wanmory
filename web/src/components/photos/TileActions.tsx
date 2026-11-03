import { Check, Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMarks } from '@/hooks/useMarks'
import { type Asset, assetPlace, type GeoPlace } from '@/lib/api'
import { cx } from '@/lib/cx'
import Tooltip from '@/components/ui/Tooltip'

const CITY_DELAY_MS = 150 // 库里还没有城市时，鼠标停这么久才让服务器去查，划过一排照片时不会每张都排队问

// TileActions 是鼠标悬停在照片上时显示的：左上角选择圈（选中后是蓝色的勾，一直显示），
// 右上角圆底的收藏（收藏过的平时也显示），底下一层渐变写拍摄的城市（有说明时先写说明，城市从库里来，见 useCity）。
// 星级、更多菜单不放在照片上，选中以后在底部的浮动栏里
export default function TileActions({
  asset,
  compact,
  hovered,
  selected,
  onToggleSelect,
  onChanged,
}: {
  asset: Asset
  compact: boolean // 照片太小，只放选择圈和收藏，不写城市
  hovered: boolean // 鼠标正停在这张上：这时才去查城市名
  selected: boolean
  onToggleSelect?: () => void
  onChanged: (asset: Asset) => void
}) {
  const { favorite, save } = useMarks(asset, onChanged)
  const reveal = 'opacity-0 group-hover:opacity-100'
  const city = useCity(asset, hovered && !compact)
  const lines = captionLines(asset, city)

  return (
    <>
      {onToggleSelect && (
        <button
          data-no-marquee
          type="button"
          onClick={onToggleSelect}
          aria-label={selected ? '取消选择' : '选择'}
          aria-pressed={selected}
          className={cx(
            'pointer-events-auto absolute top-1.5 left-1.5 z-20 flex size-5 items-center justify-center rounded-full transition',
            selected
              ? 'bg-select text-on-accent shadow'
              : cx(
                  'border-[1.5px] border-white/90 bg-black/10 shadow-[0_1px_3px_rgba(0,0,0,0.35)] hover:bg-black/25',
                  reveal,
                ),
          )}
        >
          {selected && <Check className="size-3" strokeWidth={3.2} />}
        </button>
      )}

      <Tooltip label={favorite ? '取消收藏' : '收藏'}>
        <button
          data-no-marquee
          type="button"
          onClick={() => save({ favorite: !favorite })}
          aria-label={favorite ? '取消收藏' : '收藏'}
          aria-pressed={favorite}
          className={cx(
            'pointer-events-auto absolute top-1.5 right-1.5 z-20 flex size-6 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50 active:scale-95',
            favorite ? 'opacity-100' : reveal,
          )}
        >
          <Heart className={cx('size-3.5', favorite && 'fill-current')} strokeWidth={2} />
        </button>
      </Tooltip>

      {!compact && lines && (
        <div
          className={cx(
            'absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/60 via-black/25 to-transparent px-3 pt-10 pb-2.5 text-white transition-opacity duration-300',
            reveal,
          )}
        >
          <p className="truncate text-body font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{lines[0]}</p>
          {lines[1] && (
            <p className="truncate text-caption text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{lines[1]}</p>
          )}
        </div>
      )}
    </>
  )
}

// captionLines 是照片底下的两行：有说明时「说明 / 城市 · 省」，没有时「城市 / 省 · 国家」。
// 改位置时选过地名的，地名代替城市。没有位置也没有说明就不写
function captionLines(asset: Asset, city: GeoPlace | null): [string, string?] | null {
  const place = asset.place_name || city?.city
  const region = [city?.state, city?.country].filter((s, i, all) => s && s !== place && all.indexOf(s) === i)
  if (asset.description) return [asset.description, [place, region[0]].filter(Boolean).join(' · ') || undefined]
  if (!place) return null
  return [place, region.join(' · ') || undefined]
}

// useCity 是照片所在的城市：服务器后台查好存在库里，随照片列表一起来，鼠标移上去马上就有。
// 库里还没有（刚传的、后台还没查到）时，鼠标停在照片上才让服务器当场查一次，查到也存进库里
function useCity(asset: Asset, active: boolean): GeoPlace | null {
  const [fetched, setFetched] = useState<GeoPlace | null>(null)
  const missing = !asset.geo && asset.latitude != null && asset.longitude != null
  useEffect(() => {
    if (!active || !missing || fetched) return
    let alive = true
    const t = setTimeout(() => {
      assetPlace(asset.id)
        .then((p) => alive && p && setFetched(p))
        .catch(() => {}) // 查不到就不写城市
    }, CITY_DELAY_MS)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [active, missing, fetched, asset.id])
  return asset.geo ?? fetched
}
