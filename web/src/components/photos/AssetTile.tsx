import { EyeOff } from 'lucide-react'
import { memo, useRef, useState } from 'react'
import { type Asset, originalUrl, previewUrl, thumbnailUrl } from '@/lib/api'
import TileActions from './TileActions'
import { cx } from '@/lib/cx'
import { sincePageEnter } from '@/lib/pageEnter'
import VideoBadge from './VideoBadge'

export type InfoTarget = { asset: Asset; anchor: DOMRect } | null // 要显示信息卡的照片和它在窗口里的位置
export type SelectModifiers = { toggle: boolean; range: boolean } // ⌘ / Ctrl 单击、⇧ 单击

const FADE_MS = 700 // 照片加载后淡入的时长
// 鼠标移上去照片在格子里轻轻放大，和「那年今天」的卡片一样（Tailwind 的 duration-500 + 默认缓动）。
// Tailwind v4 的 scale-105 改的是 CSS 的 scale 属性，不是 transform，过渡里要写 scale，不然会一下跳过去
const ZOOM = 'scale 500ms cubic-bezier(0.4, 0, 0.2, 1)'
const CACHED_MS = 80 // 放进页面后这么快就加载好的，是浏览器缓存里的，直接显示不淡入（刚切换过来的除外）
const QUICK_FADE_MS = 350 // 刚切换页面时缓存里的照片也淡入，快一点
const ENTER_WINDOW_MS = 1500 // 切换页面后这么久之内放进来的格子算「刚切换过来」
const ACTIONS_MIN_WIDTH = 136 // 照片宽度小于这个时，悬停只显示选择圈和收藏，不写城市

// 能悬停的设备（有鼠标）才显示悬停操作、悬停播放视频；手机上点一下直接打开大图
const canHover = window.matchMedia('(hover: hover)').matches

// AssetTile 是网格里的一张。格子的大小已经按照片原比例算好（见 PhotoGrid 的排版），照片铺满格子；
// 极窄极长的照片（全景、长截图）格子比例有上下限，多出来的部分裁掉。加载前先铺一块底色占位，照片淡入后盖住它。
function AssetTile({
  asset,
  width,
  selected,
  markHidden,
  readOnly,
  onOpen,
  onChanged,
  onSelect,
}: {
  asset: Asset
  width: number // 格子的宽度（像素）
  selected: boolean
  readOnly?: boolean // 只能看（访客）：不显示悬停时的选中、收藏、星级
  markHidden?: boolean // 隐藏了的照片左下角标一个小眼睛（见 PhotoGrid）
  onOpen: (asset: Asset) => void // 打开大图查看器
  onInfo?: (info: InfoTarget) => void // 照片上不再有「更多」菜单，信息在选中后的浮动栏里看；留着参数不用改调用的地方
  onChanged: (asset: Asset) => void
  onSelect?: (asset: Asset, modifiers: SelectModifiers) => void
}) {
  // 滚回看过的地方时格子会重新放进页面，缩略图从缓存里马上就有，再淡入一次反而一闪一闪的
  const [loaded, setLoaded] = useState<'no' | 'fade' | 'quick' | 'instant'>('no')
  const mountedAt = useRef(performance.now())
  const [broken, setBroken] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const open = () => asset.has_thumbnail && onOpen(asset)
  const hoverPlay = useHoverPlay(asset.type === 'video' && asset.has_thumbnail && canHover)

  return (
    <div
      ref={root}
      className="group relative size-full overflow-hidden rounded-xl bg-line"
      onMouseEnter={() => {
        setHovered(true)
        hoverPlay.handlers.onMouseEnter?.()
      }}
      onMouseLeave={() => {
        setHovered(false)
        hoverPlay.handlers.onMouseLeave?.()
      }}
    >
      {asset.has_thumbnail && !broken && (
        <img
          src={thumbnailUrl(asset)}
          // 照片放大后改用 1440 像素的预览图，不然 480 像素的缩略图会发糊；浏览器按屏幕像素密度自己选
          srcSet={`${thumbnailUrl(asset)} 480w, ${previewUrl(asset)} 1440w`}
          sizes={`${Math.round(width)}px`}
          alt={asset.file_name}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() =>
            setLoaded(
              performance.now() - mountedAt.current >= CACHED_MS
                ? 'fade'
                : sincePageEnter() < ENTER_WINDOW_MS
                  ? 'quick'
                  : 'instant',
            )
          }
          onError={() => setBroken(true)}
          className="absolute inset-0 size-full object-cover group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          style={{
            opacity: loaded === 'no' ? 0 : 1,
            transition:
              loaded === 'instant'
                ? ZOOM
                : `opacity ${loaded === 'quick' ? QUICK_FADE_MS : FADE_MS}ms ease-out, ${ZOOM}`,
          }}
        />
      )}

      {hoverPlay.active && (
        // 鼠标停在视频上时静音循环播放，和缩略图一样铺满格子；开始播放了才显示，之前还是缩略图
        <video
          src={originalUrl(asset)}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          onPlaying={() => hoverPlay.setPlaying(true)}
          className="pointer-events-none absolute inset-0 size-full scale-105 object-cover transition-opacity duration-200 motion-reduce:scale-100"
          style={{ opacity: hoverPlay.playing ? 1 : 0 }}
        />
      )}

      {broken && (
        <span className="absolute inset-0 flex items-center justify-center text-caption text-muted">
          缩略图加载失败
        </span>
      )}

      {/* 单击打开大图；⌘ / Ctrl 单击、⇧ 单击是多选（也可以点左上角的选择圈）。放在照片上面、按钮下面 */}
      <button
        type="button"
        aria-label={asset.file_name}
        aria-pressed={selected}
        className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-select"
        onClick={(e) => {
          const toggle = e.metaKey || e.ctrlKey
          if (onSelect && canHover && (toggle || e.shiftKey)) onSelect(asset, { toggle, range: e.shiftKey })
          else open()
        }}
      />

      {selected && (
        // 选中：照片外面一圈蓝框，框和照片之间留一道底色的细缝
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-select shadow-[inset_0_0_0_1px_var(--color-page)]" />
      )}

      {loaded !== 'no' && (
        <div className="pointer-events-none absolute inset-0">
          {asset.type === 'video' && <VideoBadge asset={asset} hideOnHover={canHover && width >= ACTIONS_MIN_WIDTH} />}
          {markHidden && asset.hidden && (
            <span
              className={cx(
                'absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-micro font-medium text-white transition-opacity',
                canHover && width >= ACTIONS_MIN_WIDTH && 'group-hover:opacity-0',
              )}
            >
              <EyeOff className="size-2.5" strokeWidth={2.4} />
              已隐藏
            </span>
          )}
          {canHover && !readOnly && (
            <TileActions
              asset={asset}
              compact={width < ACTIONS_MIN_WIDTH}
              hovered={hovered}
              selected={selected}
              onToggleSelect={onSelect && (() => onSelect(asset, { toggle: true, range: false }))}
              onChanged={onChanged}
            />
          )}
        </div>
      )}
    </div>
  )
}

// 列表合并、滚动刷新时，没变的格子不重新渲染
export default memo(AssetTile)

// useHoverPlay：鼠标一移到视频格子上就开始播放，移开就停下并收起播放器（不占内存和网络）
function useHoverPlay(enabled: boolean) {
  const [active, setActive] = useState(false)
  const [playing, setPlaying] = useState(false)
  const handlers: { onMouseEnter?: () => void; onMouseLeave?: () => void } = enabled
    ? {
        onMouseEnter: () => setActive(true),
        onMouseLeave: () => {
          setActive(false)
          setPlaying(false)
        },
      }
    : {}
  return { active, playing, setPlaying, handlers }
}
