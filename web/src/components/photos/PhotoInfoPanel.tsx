import { ArrowUpRight, Film, FolderMinus, ImageIcon, MapPin, Sparkles, Star, Upload, X } from 'lucide-react'
import { Fragment, lazy, Suspense, type ReactNode, useEffect, useState } from 'react'
import AlbumCover from '@/components/albums/AlbumCover'
import Tooltip from '@/components/ui/Tooltip'
import { useMarks } from '@/hooks/useMarks'
import {
  type Album,
  type Asset,
  type AssetDetails,
  assetDetails,
  type InfoPatch,
  isSynced,
  faceThumbUrl,
  thumbnailUrl,
  updateAsset,
} from '@/lib/api'
import { ageWhen } from '@/lib/age'
import { cx } from '@/lib/cx'
import {
  cameraName,
  dimensions,
  formatCoords,
  formatDateTime,
  formatDuration,
  formatExposure,
  formatSize,
  lensName,
  viewerDate,
} from '@/lib/format'
import { osmLink, useMapsEnabled, usePlaceName } from '@/lib/geo'
import { AdjustDateDialog, EditLocationDialog } from './InfoEditDialogs'
import { showError } from '@/lib/dialog'
import { t } from '@/i18n'

// 地图库（Leaflet）比较大，用到地图时才加载
const PlaceMap = lazy(() => import('./PlaceMap'))

// PhotoInfoPanel 是大图查看器右边的信息栏，参考 macOS「照片」和 Google 相册：
// 说明、星级、照片里的人（名字和当时多大）、在哪些相册里、拍摄时间（可以调整）、相机和参数、
// 地图上的位置（可以修改）、什么时候添加的。
// 每一块是一张圆角卡片；改动只存在数据库里，不动原文件。
export default function PhotoInfoPanel({
  asset,
  albums,
  onChanged,
  onOpenAlbum,
  onOpenPerson,
  onRemoveFromAlbum,
  onClose,
}: {
  asset: Asset
  albums: Album[] // 所有相册，按 ID 找出这张照片所在的
  onChanged: (asset: Asset) => void
  onOpenAlbum: (album: Album) => void
  onOpenPerson: (id: string) => void
  onRemoveFromAlbum: (album: Album) => Promise<void>
  onClose: () => void
}) {
  const details = useDetails(asset, albums)
  const mapsOn = useMapsEnabled() === true
  const [editing, setEditing] = useState<'date' | 'location' | null>(null)
  const save = async (patch: InfoPatch) => onChanged(await updateAsset(asset.id, patch))
  const inAlbums = albums.filter((a) => details?.albums.includes(a.id))

  return (
    <aside
      aria-label={t('照片信息')}
      className="flex w-90 shrink-0 flex-col border-l border-line bg-surface text-body max-sm:absolute max-sm:inset-y-0 max-sm:right-0 max-sm:z-20 max-sm:shadow-2xl"
    >
      <header className="relative flex h-13 shrink-0 items-center justify-center px-4">
        <button
          type="button"
          aria-label={t('关闭信息')}
          onClick={onClose}
          className="absolute left-3 flex size-8 items-center justify-center rounded-full text-fg/80 hover:bg-fg/7"
        >
          <X className="size-5" />
        </button>
        <h2 className="text-heading font-semibold">{t('信息')}</h2>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-6">
        <Description key={asset.id} asset={asset} onSave={save} />
        <Rating asset={asset} onChanged={onChanged} />
        {!!details?.people.length && <PeopleCard asset={asset} people={details.people} onOpen={onOpenPerson} />}
        {inAlbums.length > 0 && (
          <AlbumsCard albums={inAlbums} onOpen={onOpenAlbum} onRemove={(album) => onRemoveFromAlbum(album)} />
        )}
        <ShotCard asset={asset} onEditDate={() => setEditing('date')} />
        <LocationCard asset={asset} mapsOn={mapsOn} onEdit={() => setEditing('location')} />

        <p className="flex items-center gap-2 px-1 text-caption text-muted">
          <Upload className="size-3.5" strokeWidth={1.8} />
          {asset.uploader_name ? `${asset.uploader_name} · ` : ''}
          {t('{time} 添加到图库', { time: formatDateTime(asset.created_at) })}
        </p>
      </div>

      {editing === 'date' && (
        <AdjustDateDialog
          asset={asset}
          original={details?.original ?? null}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {editing === 'location' && (
        <EditLocationDialog asset={asset} mapsOn={mapsOn} onSave={save} onClose={() => setEditing(null)} />
      )}
    </aside>
  )
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx('overflow-hidden rounded-panel bg-fg/6', className)}>{children}</section>
}

// Description 是「添加说明」：点进去直接写，点到别处或按回车就保存（Shift+回车换行）
function Description({ asset, onSave }: { asset: Asset; onSave: (patch: InfoPatch) => Promise<void> }) {
  const [text, setText] = useState(asset.description)
  const commit = async () => {
    const value = text.trim()
    if (value === asset.description) return
    try {
      await onSave({ description: value })
    } catch (e) {
      showError(t('说明没有保存成功'), e)
      setText(asset.description)
    }
  }
  return (
    <Card>
      <textarea
        aria-label={t('说明')}
        placeholder={t('添加说明')}
        rows={1}
        maxLength={2000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.blur()
          }
          if (e.key === 'Escape') {
            setText(asset.description) // 放弃这次的修改；Esc 不会再关掉查看器
            e.stopPropagation()
          }
        }}
        className="block field-sizing-content max-h-40 min-h-11 w-full resize-none bg-transparent px-3 py-2.5 text-body text-fg outline-none placeholder:text-accent focus:placeholder:text-muted"
      />
    </Card>
  )
}

function Rating({ asset, onChanged }: { asset: Asset; onChanged: (asset: Asset) => void }) {
  const { rating, save } = useMarks(asset, onChanged)
  const [hover, setHover] = useState(0)
  const shown = hover || rating
  return (
    <Card className="flex h-11 items-center justify-between px-3">
      <span className="text-muted">{t('星级')}</span>
      <span role="radiogroup" aria-label={t('星级')} className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={rating === n ? t('{n} 星，再点清除', { n }) : t('{n} 星', { n })}
            onMouseEnter={() => setHover(n)}
            onClick={() => save({ rating: rating === n ? 0 : n })}
            className={cx('flex size-7 items-center justify-center', n <= shown ? 'text-accent' : 'text-muted')}
          >
            <Star className={cx('size-4.5', n <= shown && 'fill-current')} strokeWidth={1.6} />
          </button>
        ))}
      </span>
    </Card>
  )
}

// ShotCard 照着 macOS「照片」排：第一行「周二 · 2026年10月27日 · 13:01」和编辑，第二行文件名；
// 相机和格式；镜头（手机写成「主摄像头 — 26 mm ƒ1.6」）、像素和大小；最下面一排参数，中间短竖线隔开
function ShotCard({ asset, onEditDate }: { asset: Asset; onEditDate: () => void }) {
  const { day, weekday, time } = viewerDate(asset)
  const c = asset.camera
  const camera = c && cameraName(c)
  const lens = c && lensLabel(c)
  const pixels = asset.width && asset.height ? `${Math.round((asset.width * asset.height) / 1e6)} MP` : null
  const file = [pixels, dimensions(asset), formatSize(asset.file_size)].filter(Boolean).join(' · ')
  const params = c ? exposureStrip(c) : []
  const FileIcon = asset.type === 'video' ? Film : ImageIcon
  const note = asset.edited.includes('taken_at')
    ? t('已调整')
    : !asset.taken_at && t('文件里没有拍摄时间，按文件修改时间')

  return (
    <Card className="divide-y divide-line">
      <div className="px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-heading font-medium tabular-nums">
            {weekday} · {day} · {time}
          </p>
          <EditLink onClick={onEditDate} />
        </div>
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-muted" title={asset.file_name}>
          <FileIcon className="size-4 shrink-0" strokeWidth={1.7} />
          <span className="truncate">{asset.file_name}</span>
          {asset.taken_at_offset && (
            <span className="shrink-0 text-caption">UTC{asset.taken_at_offset.replace('-', '−')}</span>
          )}
        </p>
        {note && <p className="mt-1 text-caption text-muted">{note}</p>}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="min-w-0 truncate text-heading">
          {camera ?? <span className="text-muted">{t('没有相机信息')}</span>}
        </span>
        <Pill>{formatBadge(asset.mime_type)}</Pill>
      </div>

      <div className="flex items-end justify-between gap-3 px-4 py-3 text-muted">
        <div className="min-w-0">
          {lens && <p className="truncate">{lens}</p>}
          <p className={cx('truncate tabular-nums', lens && 'mt-0.5')}>{file}</p>
        </div>
        {asset.duration_ms != null && <Pill>{formatDuration(asset.duration_ms)}</Pill>}
      </div>

      {params.length > 0 && (
        <div className="flex items-center px-1.5 py-2.5 text-muted tabular-nums">
          {params.map((p, i) => (
            <Fragment key={p}>
              {i > 0 && <span aria-hidden="true" className="h-4 w-px shrink-0 bg-line-strong" />}
              <span className="min-w-0 flex-1 truncate px-0.5 text-center">{p}</span>
            </Fragment>
          ))}
        </div>
      )}
    </Card>
  )
}

// Pill 是右边的小标签：格式（JPEG、HEIC）、视频时长
function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-fg/10 px-2.5 py-0.5 text-caption font-medium tracking-wide text-fg/90 tabular-nums">
      {children}
    </span>
  )
}

// AlbumsCard 是照片所在的相册，点一下打开；手动放进去的可以从相册移除（鼠标移上去出现按钮），
// 按条件自动同步的智能相册不能手动移除
// PeopleCard 是照片里起了名字的人：小头像、名字，设了生日的写上拍照时多大。点一下看这个人的照片
function PeopleCard({
  asset,
  people,
  onOpen,
}: {
  asset: Asset
  people: AssetDetails['people']
  onOpen: (id: string) => void
}) {
  // 没有拍摄时间的（截图、别人发来的）只有文件修改时间，算出来的年龄不准，不写
  const taken = asset.taken_at ? new Date(asset.taken_at) : null
  return (
    <Card>
      <p className="px-4 pt-3 pb-1 text-caption font-medium text-muted">{t('人物')}</p>
      <ul className="pb-1.5">
        {people.map((p) => {
          const age = p.birthday && taken ? ageWhen(p.birthday, taken) : ''
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onOpen(p.id)}
                className="flex w-full items-center gap-3 px-4 py-1.5 text-left hover:bg-fg/5"
              >
                <img src={faceThumbUrl(p.face)} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                {age && <span className="shrink-0 text-caption text-muted tabular-nums">{age}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function AlbumsCard({
  albums,
  onOpen,
  onRemove,
}: {
  albums: Album[]
  onOpen: (album: Album) => void
  onRemove: (album: Album) => Promise<void>
}) {
  const [removing, setRemoving] = useState<string | null>(null)
  return (
    <Card>
      <p className="px-4 pt-3 pb-1 text-caption font-medium text-muted">{t('相册')}</p>
      <ul className="pb-1.5">
        {albums.map((a) => (
          <li key={a.id} className="group flex items-center hover:bg-fg/5">
            <button
              type="button"
              onClick={() => onOpen(a)}
              className="flex min-w-0 flex-1 items-center gap-3 py-2 pl-4 text-left"
            >
              <AlbumCover album={a} className="size-11 rounded-item" />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="truncate">{a.name}</span>
                  {a.kind === 'smart' && <Sparkles className="size-3.5 shrink-0 text-accent" strokeWidth={2} />}
                </span>
                <span className="block text-caption text-muted tabular-nums">{t('{n} 项', { n: a.count })}</span>
              </span>
            </button>
            {!isSynced(a) && (
              <Tooltip label={t('从相册移除')}>
                <button
                  type="button"
                  aria-label={t('从「{name}」移除', { name: a.name })}
                  disabled={removing === a.id}
                  onClick={async () => {
                    setRemoving(a.id)
                    try {
                      await onRemove(a)
                    } finally {
                      setRemoving(null)
                    }
                  }}
                  className="mr-2 flex size-8 shrink-0 items-center justify-center rounded-full text-muted opacity-0 transition group-hover:opacity-100 hover:bg-fg/10 hover:text-danger focus-visible:opacity-100 disabled:opacity-40 pointer-coarse:opacity-100"
                >
                  <FolderMinus className="size-4.5" strokeWidth={1.8} />
                </button>
              </Tooltip>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}

// LocationCard：有位置时是一张地图（在线地图关着时只写坐标），下面地名链接到 OpenStreetMap；没有位置时是「添加位置」
function LocationCard({ asset, mapsOn, onEdit }: { asset: Asset; mapsOn: boolean; onEdit: () => void }) {
  const { latitude: lat, longitude: lon } = asset
  const reverse = usePlaceName(lat, lon, mapsOn && !asset.place_name)
  const name = asset.place_name ?? reverse // 改位置时选的地名优先，没有再按坐标反查
  if (lat == null || lon == null) {
    return (
      <Card>
        <button
          type="button"
          onClick={onEdit}
          className="flex h-11 w-full items-center gap-2 px-3 text-accent hover:bg-fg/5"
        >
          <MapPin className="size-4" strokeWidth={1.8} />
          {t('添加位置')}
        </button>
      </Card>
    )
  }
  return (
    <Card>
      {mapsOn && (
        <Suspense fallback={<div className="map-frame h-44" />}>
          <PlaceMap
            point={{ latitude: lat, longitude: lon }}
            thumbnail={asset.has_thumbnail ? thumbnailUrl(asset) : undefined}
            className="h-44"
          />
        </Suspense>
      )}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <a
          href={osmLink(lat, lon)}
          target="_blank"
          rel="noreferrer"
          title={formatCoords(lat, lon)}
          className="flex min-w-0 items-center gap-0.5 text-accent hover:underline"
        >
          <span className="truncate">{name ?? formatCoords(lat, lon)}</span>
          <ArrowUpRight className="size-4 shrink-0" />
        </a>
        <EditLink onClick={onEdit} />
      </div>
      {asset.edited.includes('location') && <p className="-mt-1.5 px-3 pb-2 text-caption text-muted">{t('已修改')}</p>}
    </Card>
  )
}

function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 text-accent hover:underline">
      {t('编辑')}
    </button>
  )
}

// lensLabel：手机的镜头名像「back triple camera 6.765mm f/1.78」，看不出是哪颗，按等效焦距写成
// 「主摄像头 — 26 mm ƒ1.78」（2 倍裁切的 48、52 mm 也是主摄）；相机的镜头型号本身就清楚，直接用
function lensLabel(c: NonNullable<Asset['camera']>): string | null {
  const lens = lensName(c)
  const focal = c.focal_length_35 ?? c.focal_length
  if (!lens || !/\b(back|front)\b.*camera/i.test(lens)) return lens
  const kind = /front/i.test(lens)
    ? t('前置摄像头')
    : focal && focal < 20
      ? t('超广角摄像头')
      : focal && focal > 60
        ? t('长焦摄像头')
        : t('主摄像头')
  const tail = [focal && `${Math.round(focal)} mm`, c.f_number && `ƒ${Number(c.f_number.toFixed(2))}`]
  return [kind, tail.filter(Boolean).join(' ')].filter(Boolean).join(' — ')
}

// exposureStrip 是最下面那排参数：ISO、等效焦距、曝光补偿、光圈、快门
function exposureStrip(c: NonNullable<Asset['camera']>): string[] {
  const parts: string[] = []
  if (c.iso) parts.push(`ISO ${c.iso}`)
  const focal = c.focal_length_35 ?? c.focal_length
  if (focal) parts.push(`${Math.round(focal)} mm`)
  if (c.exposure_bias != null) parts.push(`${Number(c.exposure_bias.toFixed(1))} ev`)
  if (c.f_number) parts.push(`ƒ${Number(c.f_number.toFixed(1))}`)
  if (c.exposure_time) parts.push(formatExposure(c.exposure_time).replace('s', ' s'))
  return parts
}

// formatBadge：image/jpeg → JPEG，video/quicktime → MOV
function formatBadge(mime: string): string {
  const sub = mime.split('/')[1] ?? mime
  return (sub === 'quicktime' ? 'mov' : sub.replace(/^x-/, '')).toUpperCase()
}

// useDetails 取照片在哪些相册里、文件里原始的时间和位置。照片变了（改了信息）、相册变了（刚放进相册）都重新取
function useDetails(asset: Asset, albums: Album[]) {
  const [state, setState] = useState<{ asset: Asset; details: AssetDetails } | null>(null)
  useEffect(() => {
    let alive = true
    assetDetails(asset.id)
      .then((details) => alive && setState({ asset, details }))
      .catch((e) => console.error('照片信息加载失败', e))
    return () => {
      alive = false
    }
  }, [asset, albums])
  return state?.asset.id === asset.id ? state.details : null
}
