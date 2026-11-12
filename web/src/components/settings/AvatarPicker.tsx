import { Images, ImageUp, Minus, Plus, RotateCw, Upload } from 'lucide-react'
import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { CARTOONS, CartoonAvatar } from '@/components/ui/cartoonAvatars'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { DialogError, DialogFooter } from '@/components/ui/Modal'
import UserAvatar from '@/components/ui/UserAvatar'
import {
  type Asset,
  listAssets,
  previewUrl,
  setAvatar,
  setCartoonAvatar,
  thumbnailUrl,
  uploadAvatar,
  type User,
} from '@/lib/api'
import { cx } from '@/lib/cx'
import { t } from '@/i18n'

type Source = 'upload' | 'photo' | 'default' | 'cartoon'

// AvatarPicker 是「我的账号」里换头像的窗口：
//   上面一大块是预览 / 裁剪区（棋盘格底）：选了图片时在圆形框里拖动、缩放（圆外压暗），下面一条缩放滑块；
//     没选图片时圆里显示头像会变成的样子（一开始是现在的头像）；选「相册照片」时这里换成照片方格。
//   下面一排四个小圆：上传图片、相册照片、默认（名字的第一个字）、卡通——点「卡通」上面列出 12 个小动物挑。
//   最下面「取消」「保存」，点「保存」才真的换。图片、照片都裁成 512 像素的正方形传上去
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
  const [source, setSource] = useState<Source | null>(null) // null：还没挑，显示现在的头像
  const [crop, setCrop] = useState<CropState | null>(null) // 上传的图片 / 挑的照片和裁剪位置
  const [grid, setGrid] = useState(false) // 「相册照片」：显示照片方格
  const [cartoon, setCartoon] = useState<string | null>(null) // 这次挑的卡通
  const current = style.startsWith('cartoon:') ? style.slice('cartoon:'.length) : null // 现在用的卡通
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  // 打开一张图片（上传的文件、相册里的照片、转过的图），放进裁剪框里铺满居中
  const open = (src: string, from: 'upload' | 'photo') => {
    setError('')
    const el = new Image()
    el.onload = () => {
      const { w, h } = fit(el, 1)
      setCrop({ img: el, from, zoom: 1, w, h, x: (STAGE - w) / 2, y: (STAGE - h) / 2 })
      setGrid(false)
    }
    el.onerror = () => {
      if (src.startsWith('blob:')) URL.revokeObjectURL(src)
      setError(t('这张图片打不开，换一张 JPEG 或 PNG 试试'))
    }
    el.src = src
  }
  const img = crop?.img ?? null
  useEffect(
    () => () => {
      if (img?.src.startsWith('blob:')) URL.revokeObjectURL(img.src)
    },
    [img],
  )

  const choose = (s: Source) => {
    setError('')
    setSource(s)
    if (s === 'upload') {
      setGrid(false)
      if (crop?.from !== 'upload') input.current?.click()
    }
    if (s === 'photo') setGrid(crop?.from !== 'photo' || source === 'photo') // 已经在相册里时再点一下回到方格换一张
    if (s === 'cartoon' || s === 'default') setGrid(false)
  }

  const cropping = (source === 'upload' || source === 'photo') && crop?.from === source && !grid
  const picked = source === 'default' || (source === 'cartoon' && !!cartoon) || cropping

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      let res: { user: User } | null = null
      if (cropping && crop) res = await uploadAvatar(await cropToBlob(crop))
      else if (source === 'default') res = await setAvatar(null)
      else if (source === 'cartoon' && cartoon) res = await setCartoonAvatar(cartoon)
      if (res) {
        onChanged(res.user)
        onClose()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  const plain = { ...user, avatar: null, avatar_style: '' } // 默认头像：名字的第一个字
  // 预览区里显示什么
  let stage: ReactNode
  if (cropping && crop) stage = <Cropper state={crop} onChange={setCrop} />
  else if (source === 'cartoon') stage = <CartoonGrid selected={cartoon ?? current} onPick={setCartoon} />
  else if (source === 'photo') stage = <PhotoGrid onPick={(a) => open(previewUrl(a), 'photo')} />
  else if (source === 'upload')
    stage = (
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="absolute inset-5 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-muted transition-colors hover:border-accent hover:text-fg"
      >
        <ImageUp className="size-7" strokeWidth={1.5} />
        <span className="text-body">{t('点这里选一张图片，或者拖进来')}</span>
      </button>
    )
  else
    stage = (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-44 overflow-hidden rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/15">
          <UserAvatar user={source === 'default' ? plain : user} className="size-full text-[72px]" />
        </div>
      </div>
    )

  return (
    <Modal title={t('更换头像')} onClose={onClose} width="max-w-[400px]">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) {
            setSource('upload')
            open(URL.createObjectURL(f), 'upload')
          }
          e.target.value = ''
        }}
      />

      {/* 预览 / 裁剪区：铺满窗口的宽度，棋盘格底；文件可以直接拖进来 */}
      <div
        className="-mx-6 bg-[repeating-conic-gradient(rgb(128_128_128/0.14)_0_25%,transparent_0_50%)] bg-[length:16px_16px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files?.[0]
          if (f) {
            setSource('upload')
            open(URL.createObjectURL(f), 'upload')
          }
        }}
      >
        {/* 裁剪时下面多一条缩放滑块和旋转（预览区矮一点，整块高度不变）；其他时候没有这一条 */}
        <div className={cx('relative overflow-hidden', cropping ? 'h-[240px]' : 'h-[284px]')}>{stage}</div>
        {cropping && crop && (
          <div className="flex h-11 items-center gap-2 px-4 text-muted">
            <ZoomBar state={crop} onChange={setCrop} onRotate={() => rotate(crop, (src) => open(src, crop.from))} />
          </div>
        )}
      </div>

      {/* 四种来源 */}
      <div className="mt-4 grid grid-cols-4 gap-1">
        <Choice label={t('上传图片')} on={source === 'upload'} onClick={() => choose('upload')}>
          <span className="flex size-full items-center justify-center bg-accent/12 text-accent">
            <Upload className="size-5" strokeWidth={2} />
          </span>
        </Choice>
        <Choice label={t('相册照片')} on={source === 'photo'} onClick={() => choose('photo')}>
          <span className="flex size-full items-center justify-center bg-fg/[0.08] text-fg/75">
            <Images className="size-5" strokeWidth={1.8} />
          </span>
        </Choice>
        <Choice label={t('默认')} on={source === 'default'} onClick={() => choose('default')}>
          <UserAvatar user={plain} className="size-full text-[20px]" />
        </Choice>
        <Choice label={t('卡通')} on={source === 'cartoon'} onClick={() => choose('cartoon')}>
          <CartoonAvatar id={cartoon ?? current ?? 'cat'} className="size-full" />
        </Choice>
      </div>

      <DialogError>{error}</DialogError>
      <DialogFooter>
        <DialogButton onClick={onClose}>{t('取消')}</DialogButton>
        <DialogButton variant="primary" onClick={save} disabled={busy || !picked}>
          {busy ? t('保存中…') : t('保存')}
        </DialogButton>
      </DialogFooter>
    </Modal>
  )
}

// CartoonGrid：12 个小动物铺在预览区里，4 列 3 行，选中的外面一圈强调色
function CartoonGrid({ selected, onPick }: { selected: string | null; onPick: (id: string) => void }) {
  return (
    <div className="absolute inset-0 grid grid-cols-4 place-items-center content-center gap-y-3 bg-surface/85 px-4 backdrop-blur-sm">
      {CARTOONS.map((c) => {
        const on = selected === c.id
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            aria-pressed={on}
            title={c.label}
            aria-label={c.label}
            className="group rounded-full outline-none"
          >
            <CartoonAvatar
              id={c.id}
              className={cx(
                'size-14 rounded-full ring-2 ring-offset-2 ring-offset-surface transition',
                on ? 'ring-accent' : 'ring-transparent group-hover:scale-105 group-focus-visible:ring-accent/50',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

// Choice：下面那排的一个圆加名字；选中的圆外面一圈强调色
function Choice({
  label,
  on,
  onClick,
  children,
}: {
  label: string
  on: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="group flex flex-col items-center gap-1.5 rounded-xl py-1 outline-none"
    >
      <span
        className={cx(
          'relative size-14 rounded-full ring-2 ring-offset-2 ring-offset-surface transition',
          on ? 'ring-accent' : 'ring-transparent group-hover:scale-105 group-focus-visible:ring-accent/50',
        )}
      >
        <span className="block size-full overflow-hidden rounded-full">{children}</span>
      </span>
      <span className={cx('text-caption', on ? 'font-medium text-fg' : 'text-muted')}>{label}</span>
    </button>
  )
}

// PhotoGrid：收藏 / 最近的照片方格，铺在预览区里；点一张就拿去裁剪
function PhotoGrid({ onPick }: { onPick: (a: Asset) => void }) {
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
    <div className="absolute inset-0 flex flex-col bg-surface/85 px-5 pt-3 backdrop-blur-sm">
      <div className="flex gap-6 text-body">
        {(
          [
            ['favorite', t('收藏')],
            ['recent', t('最近')],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setGroup(k)}
            className={cx(
              'border-b-2 pb-1.5 transition-colors',
              group === k ? 'border-accent font-medium text-fg' : 'border-transparent text-muted hover:text-fg',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid min-h-0 flex-1 auto-rows-min grid-cols-4 gap-2 overflow-y-auto pb-3 sm:grid-cols-5">
        {assets?.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onPick(a)}
            className="aspect-square overflow-hidden rounded-lg bg-line transition outline-none hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <img src={thumbnailUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
          </button>
        ))}
        {assets === null &&
          !error &&
          Array.from({ length: 10 }, (_, i) => <div key={i} className="aspect-square rounded-lg bg-fg/[0.05]" />)}
        {error && <p className="col-span-full py-8 text-center text-body text-danger">{error}</p>}
        {assets?.length === 0 && (
          <p className="col-span-full py-8 text-center text-body text-muted">
            {group === 'favorite' ? t('还没有收藏的照片，看看「最近」') : t('还没有照片')}
          </p>
        )}
      </div>
    </div>
  )
}

const STAGE = 200 // 圆形裁剪框的直径（像素）
const OUT = 512 // 裁出来的头像多大
const MAX_ZOOM = 4

// CropState 是图片和它相对圆形框（外接正方形，STAGE×STAGE）的位置、大小（像素）；from 是从哪来的
interface CropState {
  img: HTMLImageElement
  from: 'upload' | 'photo'
  zoom: number
  x: number
  y: number
  w: number
  h: number
}

// zoom = 1 时正好铺满框
function fit(el: HTMLImageElement, zoom: number) {
  const b = STAGE / Math.min(el.naturalWidth, el.naturalHeight)
  return { w: el.naturalWidth * b * zoom, h: el.naturalHeight * b * zoom }
}
// 图片要一直盖满框，不能露出空白
function clamp(x: number, y: number, w: number, h: number) {
  return { x: Math.min(0, Math.max(STAGE - w, x)), y: Math.min(0, Math.max(STAGE - h, y)) }
}
// 以框的中心缩放
function zoomed(s: CropState, next: number): CropState {
  const z = Math.min(MAX_ZOOM, Math.max(1, next))
  const k = z / s.zoom
  const c = STAGE / 2
  const { w, h } = fit(s.img, z)
  return { ...s, zoom: z, w, h, ...clamp(c - (c - s.x) * k, c - (c - s.y) * k, w, h) }
}

// rotate：顺时针转 90 度，画成一张新图再打开（位置、缩放回到铺满居中）
function rotate(s: CropState, open: (src: string) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = s.img.naturalHeight
  canvas.height = s.img.naturalWidth
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.translate(canvas.width, 0)
  ctx.rotate(Math.PI / 2)
  ctx.drawImage(s.img, 0, 0)
  canvas.toBlob((blob) => blob && open(URL.createObjectURL(blob)), 'image/png')
}

// cropToBlob：按圆形框（外接正方形）裁成 512×512 的 JPEG
function cropToBlob(c: CropState): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = OUT
    const ctx = canvas.getContext('2d')
    if (!ctx) return reject(new Error(t('没有裁成功，换一张试试')))
    const scale = c.w / c.img.naturalWidth
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(c.img, -c.x / scale, -c.y / scale, STAGE / scale, STAGE / scale, 0, 0, OUT, OUT)
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(t('没有裁成功，换一张试试')))), 'image/jpeg', 0.9)
  })
}

// Cropper：圆形框在预览区正中，图片超出框的部分也显示出来但压暗；拖动挪位置，滚轮缩放
function Cropper({ state, onChange }: { state: CropState; onChange: (s: CropState) => void }) {
  const drag = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const start = { x: e.clientX, y: e.clientY, s: state }
    e.currentTarget.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent) =>
      onChange({
        ...start.s,
        ...clamp(start.s.x + ev.clientX - start.x, start.s.y + ev.clientY - start.y, start.s.w, start.s.h),
      })
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  return (
    <div
      onPointerDown={drag}
      onWheel={(e) => onChange(zoomed(state, state.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)))}
      className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: STAGE, height: STAGE }}
      >
        <img
          src={state.img.src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute max-w-none"
          style={{ left: state.x, top: state.y, width: state.w, height: state.h }}
        />
        {/* 圆形以外压暗：一个大阴影的圆 */}
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ring-2 ring-white/80" />
      </div>
    </div>
  )
}

// ZoomBar：预览区下面的缩放滑块，两头减号、加号，最右边旋转
function ZoomBar({
  state,
  onChange,
  onRotate,
}: {
  state: CropState
  onChange: (s: CropState) => void
  onRotate: () => void
}) {
  return (
    <>
      <IconButton label={t('缩小')} onClick={() => onChange(zoomed(state, state.zoom / 1.2))}>
        <Minus className="size-4" />
      </IconButton>
      <input
        type="range"
        min={1}
        max={MAX_ZOOM}
        step={0.01}
        value={state.zoom}
        onChange={(e) => onChange(zoomed(state, Number(e.target.value)))}
        aria-label={t('缩放')}
        className="min-w-0 flex-1 accent-accent"
      />
      <IconButton label={t('放大')} onClick={() => onChange(zoomed(state, state.zoom * 1.2))}>
        <Plus className="size-4" />
      </IconButton>
      <span className="mx-1 h-5 w-px bg-line" />
      <IconButton label={t('旋转')} onClick={onRotate}>
        <RotateCw className="size-4" />
      </IconButton>
    </>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fg/[0.08] text-fg/80 hover:bg-fg/[0.14] hover:text-fg"
    >
      {children}
    </button>
  )
}
