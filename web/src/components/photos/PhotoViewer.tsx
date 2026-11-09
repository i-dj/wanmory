import { ChevronLeft, ChevronRight, ExternalLink, Info, Maximize2, Minimize2, Minus, Play, Plus } from 'lucide-react'
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MenuItem, ToolbarButton } from '@/components/ui/Popover'
import { useElementSize } from '@/hooks/useElementSize'
import { useIdleChrome } from '@/hooks/useIdleChrome'
import { unlockAudio } from '@/lib/musicLibrary'
import { type Album, type Asset, originalUrl, previewUrl, thumbnailUrl } from '@/lib/api'
import { cx } from '@/lib/cx'
import { viewerDate } from '@/lib/format'
import Filmstrip from './Filmstrip'
import PhotoInfoPanel from './PhotoInfoPanel'
import Slideshow from './Slideshow'
import { lockScroll } from '@/lib/scrollLock'

const MAX_ZOOM = 4
const SWIPE = 60 // 没放大时左右拖这么远就换上一张、下一张（手机上滑动）
const CLICK_SLOP = 6 // 按下后移动超过这么多像素就算拖动，松开时不当单击
const IDLE_MS = 2500 // 鼠标这么久不动，工具栏、缩略图条和左右箭头就淡出
const LOAD_AHEAD = 30 // 离已经加载的末尾还剩这么多张时，接着往后加载

// 浏览器能直接显示的格式，放大时换成原图看细节；HEIC 之类的还是用 1440 像素的预览图
const HIRES_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

type View = { id: string; zoom: number; x: number; y: number } // 某张照片的放大倍数和平移

// PhotoViewer 是全屏的大图查看器：照片铺满画面，顶栏和底部缩略图条浮在照片上，鼠标一会儿不动就淡出，动一下又出来。
// 顶栏左边返回、全屏、缩放滑块，中间日期和第几张，右边播放幻灯片、信息、删除、收藏、星级、相册、更多；照片左右两边各一个箭头。
// 单击照片左半边上一张、右半边下一张（Google 相册的做法），← → 也行，Esc 关闭；
// 按住 Ctrl 滚轮或触控板捏合放大，放大后拖动平移，双击还原。
export default function PhotoViewer({
  assets,
  startId,
  total,
  onLoadMore,
  albums,
  actions,
  onChanged,
  onOpenAlbum,
  onOpenPerson,
  onRemoveFromAlbum,
  onCurrent,
  onClose,
}: {
  assets: Asset[] // 和网格里一样顺序的照片
  startId: string
  total: number | null // 这个分类一共多少张（还没全部加载时比 assets 多）
  onLoadMore: (count: number) => void // 加载到至少 count 张
  // 顶栏右边的按钮（和选中照片后工具栏上的一样）；menuExtra 是查看器自己要放进「更多」菜单的几项
  albums: Album[]
  actions: (asset: Asset, menuExtra: (close: () => void) => ReactNode) => ReactNode
  onChanged: (asset: Asset) => void // 在信息栏里改了照片
  onOpenAlbum: (album: Album) => void // 在信息栏里点了照片所在的相册
  onOpenPerson: (id: string) => void // 在信息栏里点了照片里的人
  onRemoveFromAlbum: (asset: Asset, album: Album) => Promise<void>
  onCurrent?: (id: string) => void // 换到了哪张（按数字键标星时标它）
  onClose: (lastId: string | null) => void // 关闭时停在哪张，网格滚过去
}) {
  const root = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const stageSize = useElementSize(stage)

  // 当前照片：删除、隐藏后它从列表里没了，就换成同一个位置上的那张（原来的下一张）
  const [current, setCurrent] = useState(() => ({ id: startId, index: assets.findIndex((a) => a.id === startId) }))
  const found = assets.findIndex((a) => a.id === current.id)
  const index = found >= 0 ? found : Math.min(Math.max(current.index, 0), assets.length - 1)
  const asset = assets[index] as Asset | undefined
  const go = useCallback(
    (i: number) => {
      const a = assets[i]
      if (a) setCurrent({ id: a.id, index: i })
    },
    [assets],
  )
  const currentId = asset?.id
  useEffect(() => {
    if (currentId) onCurrent?.(currentId)
  }, [currentId, onCurrent])
  useEffect(() => {
    if (!asset) onClose(null)
    else if (found < 0) setCurrent({ id: asset.id, index })
  }, [asset, found, index, onClose])

  // 放大和平移只对当时那张照片有效，换了照片就回到完整显示
  const [view, setView] = useState<View | null>(null)
  const [ratio, setRatio] = useState<{ id: string; value: number } | null>(null) // 预览图加载后的真实宽高比
  const isVideo = asset?.type === 'video'
  const live = view && asset && view.id === asset.id ? view : null
  const zoom = live?.zoom ?? 1
  const aspect =
    ratio && ratio.id === asset?.id ? ratio.value : asset?.width && asset.height ? asset.width / asset.height : 1

  // clamp 让放大后的照片边缘不离开画面：照片比画面小的方向不能移动
  const clamp = useCallback(
    (z: number, x: number, y: number) => {
      const fitWidth = Math.min(stageSize.width, stageSize.height * aspect)
      const fitHeight = fitWidth / aspect
      const maxX = Math.max(0, (fitWidth * z - stageSize.width) / 2)
      const maxY = Math.max(0, (fitHeight * z - stageSize.height) / 2)
      return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) }
    },
    [stageSize.width, stageSize.height, aspect],
  )
  // zoomTo 放大到 z 倍，point（相对画面中心）下面的那一点保持不动；不给 point 就以画面中心为准
  const zoomTo = useCallback(
    (z: number, point = { x: 0, y: 0 }) => {
      if (!asset || isVideo) return
      const next = Math.min(MAX_ZOOM, Math.max(1, z))
      const prev = live ?? { zoom: 1, x: 0, y: 0 }
      const x = point.x - ((point.x - prev.x) / prev.zoom) * next
      const y = point.y - ((point.y - prev.y) / prev.zoom) * next
      setView({ id: asset.id, zoom: next, ...clamp(next, x, y) })
    },
    [asset, isVideo, live, clamp],
  )

  // 拖动：放大时平移，没放大时左右拖换照片。拖过的不算单击
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null)
  const dragged = useRef(false)
  const [dragging, setDragging] = useState(false)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || isVideo) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, startX: live?.x ?? 0, startY: live?.y ?? 0 }
    dragged.current = false
    setDragging(true)
  }
  const [hoverSide, setHoverSide] = useState<'left' | 'right'>('right') // 鼠标在照片的哪半边，决定显不显示小手
  const onPointerMove = (e: React.PointerEvent) => {
    const box = e.currentTarget.getBoundingClientRect()
    const side = e.clientX - box.left < box.width / 2 ? 'left' : 'right'
    if (side !== hoverSide) setHoverSide(side)
    const d = drag.current
    if (!d || !asset) return
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > CLICK_SLOP) dragged.current = true
    if (zoom > 1)
      setView({ id: asset.id, zoom, ...clamp(zoom, d.startX + e.clientX - d.x, d.startY + e.clientY - d.y) })
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    setDragging(false)
    if (!d || zoom > 1) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - d.y)) go(dx < 0 ? index + 1 : index - 1)
  }
  // 单击左半边上一张、右半边下一张，和 Google 相册一样。放大时单击不翻页（在拖着看细节），双击还原
  const onClick = (e: React.MouseEvent) => {
    if (dragged.current || zoom > 1 || e.detail > 1) return
    const box = e.currentTarget.getBoundingClientRect()
    go(e.clientX - box.left < box.width / 2 ? index - 1 : index + 1)
  }
  const onDoubleClick = () => zoom > 1 && setView(null)

  // 按住 Ctrl 滚轮（触控板捏合也是这个）放大缩小；要阻止浏览器自己缩放整个页面，只能用非被动的监听
  const zoomRef = useRef(zoomTo)
  zoomRef.current = zoomTo
  const zoomValue = useRef(zoom)
  zoomValue.current = zoom
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const box = el.getBoundingClientRect()
      zoomRef.current(zoomValue.current * Math.exp(-e.deltaY * 0.01), {
        x: e.clientX - box.left - box.width / 2,
        y: e.clientY - box.top - box.height / 2,
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // 快到已加载的末尾时接着加载；预先加载前后两张的预览图，换照片时马上出来
  useEffect(() => {
    onLoadMore(index + LOAD_AHEAD)
    for (const a of [assets[index + 1], assets[index - 1]]) {
      if (a?.type === 'image' && a.has_thumbnail) new Image().src = previewUrl(a)
    }
  }, [index, assets, onLoadMore])

  // 打开时页面不滚动；全屏状态跟着浏览器
  useEffect(() => lockScroll(), [])
  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === root.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  const toggleFullscreen = () =>
    document.fullscreenElement ? void document.exitFullscreen() : void root.current?.requestFullscreen()

  const [showInfo, setShowInfo] = useState(false)
  const [slideshow, setSlideshow] = useState(false)
  const endSlideshow = useCallback(
    (i: number) => {
      setSlideshow(false)
      go(i) // 回到查看器，停在幻灯片放到的那张
    },
    [go],
  )
  const close = useCallback(() => onClose(asset?.id ?? null), [onClose, asset])
  const chromeVisible = useIdleChrome(root, IDLE_MS, overlayOpen)

  // 键盘：← → 换照片，Esc 关闭，I 开关信息栏。菜单、删除确认、编辑对话框开着时都交给它们
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')
      if (typing || overlayOpen()) return
      if (e.key === 'ArrowLeft') go(index - 1)
      else if (e.key === 'ArrowRight') go(index + 1)
      else if (e.key === 'Escape') close()
      else if (e.key === 'i' && !e.metaKey && !e.ctrlKey) setShowInfo((s) => !s)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [go, index, close])

  if (!asset) return null
  const { date, time } = viewerDate(asset)
  const position = `第 ${(index + 1).toLocaleString()} 张，共 ${Math.max(total ?? 0, assets.length).toLocaleString()} 张`

  // 顶栏和缩略图条不加底色、不模糊，只在照片上下边叠一层渐暗，照片原样透出来。
  // 渐变那一截不挡鼠标（还能点照片翻页），里面的按钮和缩略图才接收点击；隐藏时都不接收
  const fade = chromeVisible ? 'opacity-100' : 'opacity-0'
  const interactive = chromeVisible && 'pointer-events-auto'
  const arrowFade = cx(fade, !chromeVisible && 'pointer-events-none')
  const scrim = cx(
    'pointer-events-none absolute inset-x-0 z-10 from-black/60 via-black/25 to-transparent transition-opacity duration-300',
    fade,
  )

  return createPortal(
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={asset.file_name}
      className="theme-dark fixed inset-0 z-45 flex bg-black text-fg"
    >
      <div className="relative min-w-0 flex-1">
        <div
          ref={stage}
          className="absolute inset-0 touch-none overflow-hidden select-none"
          style={{
            cursor: !chromeVisible
              ? 'none'
              : zoom > 1
                ? dragging
                  ? 'grabbing'
                  : 'grab'
                : !isVideo && (hoverSide === 'left' ? index > 0 : index < assets.length - 1)
                  ? 'pointer' // 点这半边能翻页
                  : undefined,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={isVideo ? undefined : onClick}
          onDoubleClick={isVideo ? undefined : onDoubleClick}
        >
          {isVideo ? (
            // 视频不放在工具栏和缩略图条底下，播放器自己的进度条才不会被挡住
            <div className="absolute inset-x-0 top-13 bottom-16">
              <video
                key={asset.id}
                src={originalUrl(asset)}
                poster={asset.has_thumbnail ? previewUrl(asset) : undefined}
                controls
                autoPlay
                playsInline
                className="size-full object-contain"
              />
            </div>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${live?.x ?? 0}px, ${live?.y ?? 0}px) scale(${zoom})`,
                transition: dragging ? 'none' : 'transform 160ms ease-out',
              }}
            >
              <PhotoLayers
                key={asset.id}
                asset={asset}
                hires={zoom > 1 && HIRES_TYPES.has(asset.mime_type)}
                onRatio={(value) => setRatio({ id: asset.id, value })}
              />
            </div>
          )}
        </div>

        {index > 0 && <SideArrow side="left" className={arrowFade} onClick={() => go(index - 1)} />}
        {index < assets.length - 1 && <SideArrow side="right" className={arrowFade} onClick={() => go(index + 1)} />}

        <header className={cx(scrim, 'top-0 bg-linear-to-b pb-10')}>
          <div className={cx('grid h-13 grid-cols-[1fr_auto_1fr] items-center gap-3 px-3', interactive)} data-chrome>
            <div className="flex items-center gap-1">
              <ToolbarButton icon={ChevronLeft} label="返回" onClick={close} />
              {document.fullscreenEnabled && (
                <div className="hidden sm:block">
                  <ToolbarButton
                    icon={fullscreen ? Minimize2 : Maximize2}
                    label={fullscreen ? '退出全屏' : '全屏'}
                    onClick={toggleFullscreen}
                  />
                </div>
              )}
              <div className="ml-2 hidden sm:block">
                <ZoomControl zoom={zoom} disabled={isVideo} onChange={(z) => zoomTo(z)} />
              </div>
            </div>

            <div className="min-w-0 text-center">
              <h2 className="truncate text-body font-semibold text-white text-shadow-sm">{date}</h2>
              <p className="truncate text-caption text-white/75 tabular-nums text-shadow-sm">
                {time} · {position}
              </p>
            </div>

            <div className="flex items-center justify-end gap-0.5">
              <ToolbarButton
                icon={Play}
                label="播放幻灯片"
                onClick={() => {
                  unlockAudio() // 必须在这次点击里同步解锁声音，进了幻灯片（还会请求全屏）再放就可能被浏览器挡掉
                  setSlideshow(true)
                }}
              />
              <ToolbarButton icon={Info} label="信息" pressed={showInfo} onClick={() => setShowInfo((s) => !s)} />
              {actions(asset, (closeMenu) => (
                <MenuItem
                  icon={ExternalLink}
                  label="打开原图"
                  onClick={() => {
                    closeMenu()
                    window.open(originalUrl(asset), '_blank', 'noreferrer')
                  }}
                />
              ))}
            </div>
          </div>
        </header>

        <footer className={cx(scrim, 'bottom-0 bg-linear-to-t pt-10')}>
          <div className={cx('px-3 py-2.5', interactive)} data-chrome>
            <Filmstrip assets={assets} index={index} onPick={go} />
          </div>
        </footer>
      </div>

      {slideshow && <Slideshow assets={assets} startIndex={index} onLoadMore={onLoadMore} onClose={endSlideshow} />}
      {showInfo && (
        <PhotoInfoPanel
          key={asset.id} // 换了一张就整个重来，不留上一张的
          asset={asset}
          albums={albums}
          onChanged={onChanged}
          onOpenAlbum={onOpenAlbum}
          onOpenPerson={onOpenPerson}
          onRemoveFromAlbum={(album) => onRemoveFromAlbum(asset, album)}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>,
    document.body,
  )
}

// overlayOpen：查看器上面还开着菜单、删除确认或者对话框（新建相册……）。这时 Esc 只关它们，工具栏也不淡出
const overlayOpen = () =>
  !!document.querySelector('[role="menu"], #delete-title') || document.querySelectorAll('[role="dialog"]').length > 1

// SideArrow 是照片左右两边的大箭头，半透明圆底，亮暗照片上都看得清
function SideArrow({ side, className, onClick }: { side: 'left' | 'right'; className: string; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      aria-label={side === 'left' ? '上一张' : '下一张'}
      data-chrome
      onClick={onClick}
      className={cx(
        'absolute top-1/2 z-10 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition duration-300 hover:bg-black/45 active:scale-95',
        side === 'left' ? 'left-3' : 'right-3',
        className,
      )}
    >
      <Icon className="size-7" strokeWidth={2.4} />
    </button>
  )
}

// PhotoLayers 是一张照片的几层图：先铺缩略图（网格里看过，一般在缓存里，马上就有），
// 1440 像素的预览图加载好后盖上去；放大时再盖上原图看细节。换照片时整个重建，加载状态跟着清零
function PhotoLayers({ asset, hires, onRatio }: { asset: Asset; hires: boolean; onRatio: (ratio: number) => void }) {
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [hiresLoaded, setHiresLoaded] = useState(false)
  const [wantHires, setWantHires] = useState(false) // 放大过一次就留着原图，缩回去再放大不用重新加载
  if (hires && !wantHires) setWantHires(true)

  if (!asset.has_thumbnail)
    return <p className="flex size-full items-center justify-center text-body text-muted">这张照片还没有生成预览</p>
  const layer = 'pointer-events-none absolute inset-0 size-full object-contain'
  return (
    <>
      {!previewLoaded && <img src={thumbnailUrl(asset)} alt="" draggable={false} className={layer} />}
      <img
        src={previewUrl(asset)}
        alt={asset.file_name}
        draggable={false}
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget
          if (w && h) onRatio(w / h)
          setPreviewLoaded(true)
        }}
        className={cx(layer, !previewLoaded && 'opacity-0')}
      />
      {wantHires && (
        <img
          src={originalUrl(asset)}
          alt=""
          draggable={false}
          onLoad={() => setHiresLoaded(true)}
          className={cx(layer, !hiresLoaded && 'opacity-0')}
        />
      )}
    </>
  )
}

// ZoomControl：− 滑块 +，1 倍（完整显示）到 4 倍，和网格的缩放滑块一个样子
function ZoomControl({
  zoom,
  disabled,
  onChange,
}: {
  zoom: number
  disabled: boolean
  onChange: (zoom: number) => void
}) {
  const filled = ((zoom - 1) / (MAX_ZOOM - 1)) * 100
  const step = 'rounded p-0.5 text-accent disabled:opacity-30'
  return (
    <div className={cx('flex items-center gap-2', disabled && 'opacity-40')}>
      <button
        type="button"
        aria-label="缩小"
        disabled={disabled || zoom <= 1}
        onClick={() => onChange(zoom - 0.5)}
        className={step}
      >
        <Minus className="size-4" />
      </button>
      <input
        type="range"
        min={1}
        max={MAX_ZOOM}
        step={0.05}
        value={zoom}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`放大 ${zoom.toFixed(1)} 倍`}
        className="zoom-range w-24"
        style={{ '--filled': `${filled}%` } as CSSProperties}
      />
      <button
        type="button"
        aria-label="放大"
        disabled={disabled || zoom >= MAX_ZOOM}
        onClick={() => onChange(zoom + 0.5)}
        className={step}
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
