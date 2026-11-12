import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import type { Asset } from '@/lib/api'
import {
  cameraName,
  dimensions,
  exposureParts,
  formatCoords,
  formatDateTime,
  formatDuration,
  formatLocalClock,
  formatSize,
  lensName,
} from '@/lib/format'
import { cx } from '@/lib/cx'
import { t } from '@/i18n'

const CARD_WIDTH = 280
const GAP = 8

// PhotoInfoCard 是照片的信息卡（在照片「更多」菜单里点「照片信息」时出现）：拍摄时间、相机、镜头、参数、位置。
// 用 fixed 定位贴在照片旁边：右边放不下就放左边，上下不超出窗口。
export default function PhotoInfoCard({ asset, anchor }: { asset: Asset; anchor: DOMRect }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const height = ref.current?.offsetHeight ?? 0
    let left = anchor.right + GAP
    if (left + CARD_WIDTH > window.innerWidth - GAP) left = anchor.left - GAP - CARD_WIDTH
    left = Math.max(GAP, left)
    const top = Math.max(GAP, Math.min(anchor.top, window.innerHeight - GAP - height))
    setPos({ left, top })
  }, [anchor])

  return (
    <div
      ref={ref}
      role="tooltip"
      style={{ width: CARD_WIDTH, left: pos?.left ?? 0, top: pos?.top ?? 0 }}
      className={cx(
        'glass-menu pointer-events-none fixed z-30 rounded-panel p-3 text-body transition-opacity duration-150',
        pos ? 'opacity-100' : 'opacity-0',
      )}
    >
      <PhotoDetails asset={asset} />
    </div>
  )
}

// PhotoDetails 是照片信息的内容：文件名、拍摄时间、相机、镜头、参数、位置、文件大小。
// 网格里的信息卡和大图查看器右边的信息栏都用它。
export function PhotoDetails({ asset }: { asset: Asset }) {
  const c = asset.camera
  const camera = c && cameraName(c)
  const lens = c && lensName(c)
  const params = c ? exposureParts(c) : []
  const size = [dimensions(asset), formatSize(asset.file_size)].filter(Boolean).join(' · ')

  return (
    <>
      <p className="mb-2 truncate font-medium" title={asset.file_name}>
        {asset.file_name}
      </p>
      <dl className="grid grid-cols-[3.5em_1fr] gap-x-2 gap-y-1.5">
        <Row label={t('拍摄')}>
          {asset.taken_at_local ? (
            formatLocalClock(asset.taken_at_local, asset.taken_at_offset)
          ) : (
            <span className="text-muted">
              {t('没有记录（文件时间 {time}）', { time: formatDateTime(asset.file_mtime) })}
            </span>
          )}
        </Row>
        {camera && <Row label={t('相机')}>{camera}</Row>}
        {lens && <Row label={t('镜头')}>{lens}</Row>}
        {params.length > 0 && (
          <Row label={t('参数')}>
            <span className="flex flex-wrap gap-1">
              {params.map((p) => (
                <span key={p} className="rounded bg-accent-soft px-1.5 text-accent">
                  {p}
                </span>
              ))}
            </span>
          </Row>
        )}
        {asset.duration_ms != null && <Row label={t('时长')}>{formatDuration(asset.duration_ms)}</Row>}
        <Row label={t('位置')}>
          {asset.latitude != null && asset.longitude != null ? (
            formatCoords(asset.latitude, asset.longitude)
          ) : (
            <span className="text-muted">{t('没有位置信息')}</span>
          )}
        </Row>
        <Row label={t('文件')}>
          <span className="text-muted">{size}</span>
        </Row>
      </dl>
      {!c && <p className="mt-2 text-caption text-muted">{t('这张照片没有相机信息，可能是截图或导出时去掉了。')}</p>}
    </>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 wrap-break-word">{children}</dd>
    </>
  )
}
