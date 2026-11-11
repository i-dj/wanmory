import { ImageUp, Minus, Plus, RotateCw, UserRound } from 'lucide-react'
import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { CARTOONS, CartoonAvatar } from '@/components/ui/cartoonAvatars'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { DialogActions, DialogError } from '@/components/ui/Modal'
import Segmented from '@/components/ui/Segmented'
import { type Asset, listAssets, setAvatar, setCartoonAvatar, thumbnailUrl, uploadAvatar, type User } from '@/lib/api'
import { cx } from '@/lib/cx'

type Tab = 'photo' | 'cartoon' | 'upload'

// AvatarPicker 是「我的账号」里换头像的窗口，三种：
//   照片：收藏 / 最近的照片方格，点一张就换上
//   卡通：12 个小动物，点一个就换上
//   上传图片：选一张电脑、手机里的图片，在圆形框里拖动、缩放裁好，裁成 512 像素的正方形传上去
// 换成功窗口关掉、头像跟着变，不弹提示；没成功的原因写在窗口里
export default function AvatarPicker({
  user,
  onClose,
  onChanged,
}: {
  user: User
  onClose: () => void
  onChanged: (u: User) => void
}) {
  const style = user.avatar_style ?? ''
  const [tab, setTab] = useState<Tab>(
    style.startsWith('cartoon:') ? 'cartoon' : style.startsWith('file:') ? 'upload' : 'photo',
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const apply = async (action: () => Promise<{ user: User }>) => {
    setBusy(true)
    setError('')
    try {
      const { user: u } = await action()
      onChanged(u)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Modal title="更换头像" icon={UserRound} onClose={onClose} width="max-w-xl">
      <Segmented<Tab>
        label="头像来源"
        value={tab}
        onChange={(t) => {
          setTab(t)
          setError('')
        }}
        segments={[
          { value: 'photo', label: '照片' },
          { value: 'cartoon', label: '卡通' },
          { value: 'upload', label: '上传图片' },
        ]}
      />
      <div className="mt-4">
        {tab === 'photo' && <PhotoGrid onPick={(a) => apply(() => setAvatar(a.id))} disabled={busy} />}
        {tab === 'cartoon' && (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {CARTOONS.map((c) => {
              const current = style === `cartoon:${c.id}`
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={busy}
                  onClick={() => apply(() => setCartoonAvatar(c.id))}
                  className="group flex flex-col items-center gap-1.5 rounded-control py-1.5 transition-colors hover:bg-fg/[0.05]"
                >
                  <CartoonAvatar
                    id={c.id}
                    className={cx(
                      'size-14 rounded-full ring-2 ring-offset-2 ring-offset-surface transition',
                      current ? 'ring-accent' : 'ring-transparent group-hover:scale-105',
                    )}
                  />
                  <span className="text-caption text-muted">{c.label}</span>
                </button>
              )
            })}
          </div>
        )}
        {tab === 'upload' && (
          <Uploader busy={busy} onCancel={onClose} onDone={(blob) => apply(() => uploadAvatar(blob))} />
        )}
      </div>
      <DialogError>{error}</DialogError>
    </Modal>
  )
}

// PhotoGrid：收藏 / 最近的照片方格
function PhotoGrid({ onPick, disabled }: { onPick: (a: Asset) => void; disabled: boolean }) {
  const [group, setGroup] = useState<'favorite' | 'recent'>('favorite')
  const [assets, setAssets] = useState<Asset[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    setAssets(null)
    setError('')
    listAssets(group === 'favorite' ? { favorite: true, kind: 'photo' } : { kind: 'photo' }, null, 60)
      .then((p) => setAssets(p.items))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [group])
  return (
    <>
      <div className="flex gap-4 text-body">
        {(
          [
            ['favorite', '收藏'],
            ['recent', '最近'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setGroup(k)}
            className={cx(
              'pb-1 transition-colors',
              group === k ? 'border-b-2 border-accent font-medium text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid max-h-[50vh] grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-5">
        {assets?.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(a)}
            className="aspect-square overflow-hidden rounded-md bg-line transition hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <img src={thumbnailUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
          </button>
        ))}
      </div>
      {error && <p className="py-8 text-center text-body text-danger">{error}</p>}
      {assets?.length === 0 && (
        <p className="py-8 text-center text-body text-muted">
          {group === 'favorite' ? '还没有收藏的照片，看看「最近」' : '还没有照片'}
        </p>
      )}
    </>
  )
}

const STAGE = 288 // 裁剪框多大（像素）
const OUT = 512 // 裁出来的头像多大
const MAX_ZOOM = 4

// Uploader：先选图片，选好后在正方形里显示，圆形以外压暗；拖动挪位置，滑块或滚轮缩放（以中心为准），可以旋转，
// 「使用这张」时按圆形框裁成 512×512 的 JPEG
function Uploader({ busy, onCancel, onDone }: { busy: boolean; onCancel: () => void; onDone: (blob: Blob) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 }) // 图片左上角在框里的位置（像素）
  const [error, setError] = useState('')

  const base = img ? STAGE / Math.min(img.naturalWidth, img.naturalHeight) : 1 // zoom = 1 时正好铺满框
  const size = img ? { w: img.naturalWidth * base * zoom, h: img.naturalHeight * base * zoom } : { w: 0, h: 0 }
  // 图片要一直盖满框，不能露出空白
  const clamp = (p: { x: number; y: number }, w = size.w, h = size.h) => ({
    x: Math.min(0, Math.max(STAGE - w, p.x)),
    y: Math.min(0, Math.max(STAGE - h, p.y)),
  })

  const open = (file: Blob) => {
    setError('')
    const url = URL.createObjectURL(file)
    const el = new Image()
    el.onload = () => {
      const b = STAGE / Math.min(el.naturalWidth, el.naturalHeight)
      setImg(el)
      setZoom(1)
      setPos({ x: (STAGE - el.naturalWidth * b) / 2, y: (STAGE - el.naturalHeight * b) / 2 })
    }
    el.onerror = () => {
      URL.revokeObjectURL(url)
      setError('这张图片打不开，换一张 JPEG 或 PNG 试试')
    }
    el.src = url
  }
  useEffect(
    () => () => {
      if (img) URL.revokeObjectURL(img.src)
    },
    [img],
  )

  const zoomTo = (next: number) => {
    if (!img) return
    const z = Math.min(MAX_ZOOM, Math.max(1, next))
    const k = z / zoom
    const c = STAGE / 2
    const w = img.naturalWidth * base * z
    const h = img.naturalHeight * base * z
    setZoom(z)
    setPos(clamp({ x: c - (c - pos.x) * k, y: c - (c - pos.y) * k }, w, h))
  }

  // 旋转：顺时针转 90 度。把图片转好画成一张新图，再当成新选的图片打开（位置、缩放回到铺满居中）
  const rotate = () => {
    if (!img) return
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalHeight
    canvas.height = img.naturalWidth
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.translate(canvas.width, 0)
    ctx.rotate(Math.PI / 2)
    ctx.drawImage(img, 0, 0)
    canvas.toBlob((blob) => blob && open(blob), 'image/png')
  }

  const drag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!img) return
    e.preventDefault()
    const start = { x: e.clientX, y: e.clientY, pos }
    e.currentTarget.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent) =>
      setPos(clamp({ x: start.pos.x + ev.clientX - start.x, y: start.pos.y + ev.clientY - start.y }))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const crop = () => {
    if (!img) return
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = OUT
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scale = base * zoom
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, -pos.x / scale, -pos.y / scale, STAGE / scale, STAGE / scale, 0, 0, OUT, OUT)
    canvas.toBlob((blob) => (blob ? onDone(blob) : setError('没有裁成功，换一张试试')), 'image/jpeg', 0.9)
  }

  const picker = (
    <input
      ref={input}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/heic"
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0]
        if (f) open(f)
        e.target.value = ''
      }}
    />
  )

  if (!img)
    return (
      <>
        {picker}
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f) open(f)
          }}
          className="flex w-full flex-col items-center gap-2 rounded-panel border border-dashed border-line-strong px-4 py-12 text-muted transition-colors hover:border-accent hover:text-fg"
        >
          <ImageUp className="size-7" strokeWidth={1.6} />
          <span className="text-body">点这里选一张图片，或者拖进来</span>
          <span className="text-caption">选好后可以拖动、缩放，裁出头像</span>
        </button>
        <DialogError>{error}</DialogError>
      </>
    )

  return (
    <>
      {picker}
      <div className="flex flex-col items-center">
        <div
          onPointerDown={drag}
          onWheel={(e) => zoomTo(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
          className="relative cursor-grab touch-none overflow-hidden rounded-lg bg-black select-none active:cursor-grabbing"
          style={{ width: STAGE, height: STAGE }}
        >
          <img
            src={img.src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute max-w-none"
            style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
          />
          {/* 圆形以外压暗：一个大阴影的圆 */}
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ring-2 ring-white/70" />
        </div>
        <div className="mt-4 flex w-full max-w-[288px] items-center gap-2 text-muted">
          <button
            type="button"
            aria-label="缩小"
            onClick={() => zoomTo(zoom / 1.2)}
            className="rounded-full p-1 hover:bg-fg/[0.06] hover:text-fg"
          >
            <Minus className="size-4" />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => zoomTo(Number(e.target.value))}
            aria-label="缩放"
            className="flex-1 accent-accent"
          />
          <button
            type="button"
            aria-label="放大"
            onClick={() => zoomTo(zoom * 1.2)}
            className="rounded-full p-1 hover:bg-fg/[0.06] hover:text-fg"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-4 text-caption text-muted">
          <button type="button" onClick={rotate} className="flex items-center gap-1 hover:text-fg">
            <RotateCw className="size-3.5" />
            旋转
          </button>
          <button type="button" onClick={() => input.current?.click()} className="hover:text-fg">
            换一张图片
          </button>
        </div>
      </div>
      <DialogError>{error}</DialogError>
      <DialogActions className="mt-2">
        <DialogButton onClick={onCancel}>取消</DialogButton>
        <DialogButton variant="primary" onClick={crop} disabled={busy}>
          使用这张
        </DialogButton>
      </DialogActions>
    </>
  )
}
