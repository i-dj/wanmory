import PageHeader from '@/components/layout/PageHeader'
import { Check, ChevronLeft, ChevronRight, Layers, Maximize2, Sparkles, X } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { Button, DialogActions } from '@/components/ui/Modal'
import Segmented from '@/components/ui/Segmented'
import { assetPreviewUrl, assetThumbUrl, type Burst, listBursts, reviewBursts } from '@/lib/api'
import { cx } from '@/lib/cx'
import { formatSize } from '@/lib/format'
import { dayTitle } from '@/lib/groups'
import { showAlert, showError } from '@/lib/dialog'
import { lockScroll } from '@/lib/scrollLock'
import { t as tr } from '@/i18n'

// BurstsPage 是连拍整理：几秒内连着拍的一组照片、同一个场景接着拍的几张（看起来几乎一样）、同一张存了几份的，
// 放在一起，自动挑出最好的一张
// （脸清楚、正脸的优先，再看照片细节），点别的照片可以换成保留它。「保留」只留选中的那张，其余的放进「最近删除」，
// 「都保留」以后不再列出这一组。
// 同一张存了几份的不用挑，单独放在「重复」里；连拍和相似的要看清楚才挑得出，点照片右上角能放大对比。
// 每组是一张按内容宽度的小卡片，一行放得下几组就放几组，按拍摄的日子分段。上面可以一键按推荐整理这一类的全部
type Tab = 'bursts' | 'duplicates'

// 一次只画这么多组，滚到下面再接着画。重复的可能有几千组、几万张缩略图，一下子全画出来页面会卡住
const BATCH = 40

const keyOf = (b: Burst) => b.photos[0].id

// 整理时每批最多这么多张（一组不拆开）：2000 个 ID 大约 80 KB，离服务器 1 MB 的上限很远
const BATCH_PHOTOS = 2000

function batches(targets: Burst[]): Burst[][] {
  const out: Burst[][] = []
  let cur: Burst[] = []
  let n = 0
  for (const b of targets) {
    if (cur.length && n + b.photos.length > BATCH_PHOTOS) {
      out.push(cur)
      cur = []
      n = 0
    }
    cur.push(b)
    n += b.photos.length
  }
  if (cur.length) out.push(cur)
  return out
}

export default function BurstsPage() {
  const [bursts, setBursts] = useState<Burst[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [keep, setKeep] = useState<Record<string, string>>({}) // 每组（按第一张的 ID）选了保留哪张，没选是推荐的
  const [tab, setTab] = useState<Tab | null>(null) // 没选时：有连拍先看连拍，没有就看重复
  const [busy, setBusy] = useState(false)
  const [confirmAll, setConfirmAll] = useState(false)
  const [comparing, setComparing] = useState<{ burst: Burst; index: number } | null>(null)

  useEffect(() => {
    let alive = true
    listBursts()
      .then((b) => alive && setBursts(b))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [])

  const keeperOf = (b: Burst) => keep[keyOf(b)] ?? b.best
  const pick = useCallback((b: Burst, id: string) => setKeep((prev) => ({ ...prev, [keyOf(b)]: id })), [])

  const lists = useMemo(
    () => ({
      bursts: (bursts ?? []).filter((b) => !b.duplicate),
      duplicates: (bursts ?? []).filter((b) => b.duplicate),
    }),
    [bursts],
  )
  const current = tab ?? (lists.bursts.length || !lists.duplicates.length ? 'bursts' : 'duplicates')
  const groups = lists[current]

  const extra = useMemo(() => {
    let count = 0
    let bytes = 0
    for (const b of groups)
      for (const p of b.photos)
        if (p.id !== (keep[b.photos[0].id] ?? b.best)) {
          count++
          bytes += p.size
        }
    return { count, bytes }
  }, [groups, keep])

  // 先画前面几组，底下的标记滚进来时再多画一批；换了标签从头来
  const [shown, setShown] = useState(BATCH)
  useEffect(() => setShown(BATCH), [current])
  const more = useRef<HTMLDivElement>(null)
  const hasMore = shown < groups.length
  useEffect(() => {
    const el = more.current
    if (!el || !hasMore) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setShown((n) => n + BATCH)
      },
      { rootMargin: '800px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, shown])

  // 按拍摄的日子分段（列表已经是最近的在前）
  const days = useMemo(() => {
    const out: { key: string; title: string; groups: Burst[] }[] = []
    for (const b of groups.slice(0, shown)) {
      const t = new Date(b.photos[0].taken)
      const key = t.toDateString()
      const last = out[out.length - 1]
      if (last?.key === key) last.groups.push(b)
      else out.push({ key, title: dayTitle(t), groups: [b] })
    }
    return out
  }, [groups, shown])

  // 整理 groups：keepAll 是都保留，不然只留选中的那张
  const keepRef = useRef(keep)
  keepRef.current = keep
  const review = useCallback(async (targets: Burst[], keepAll: boolean) => {
    const keeperOf = (b: Burst) => keepRef.current[keyOf(b)] ?? b.best
    setBusy(true)
    let trashed = 0
    const done = new Set<string>()
    try {
      // 分批发：服务器一次最多收 1 MB，几千组一起发会超；每批最多 BATCH_PHOTOS 张
      for (const batch of batches(targets)) {
        const ids = batch.flatMap((b) => b.photos.map((p) => p.id))
        const trash = keepAll ? [] : batch.flatMap((b) => b.photos.filter((p) => p.id !== keeperOf(b)).map((p) => p.id))
        await reviewBursts(ids, trash)
        trashed += trash.length
        for (const b of batch) done.add(keyOf(b))
      }
      showAlert(
        keepAll
          ? tr('都保留了，这一组不会再出现')
          : tr('已把 {v0} 张放进「最近删除」', { v0: trashed.toLocaleString() }),
      )
    } catch (e) {
      showError(tr('没有整理成功'), e) // 已经发出去的几批整理好了，下面照样从列表拿掉
    } finally {
      if (done.size) setBursts((prev) => prev?.filter((b) => !done.has(keyOf(b))) ?? null)
      setBusy(false)
    }
  }, [])
  const compare = useCallback((burst: Burst, index: number) => setComparing({ burst, index }), [])

  const label = current === 'duplicates' ? tr('重复') : tr('连拍和相似')
  return (
    <section className="pb-12">
      <PageHeader
        title={tr('连拍整理')}
        right={
          !!groups.length && (
            <Button primary disabled={busy} onClick={() => setConfirmAll(true)}>
              {current === 'duplicates' ? tr('全部去重') : tr('全部按推荐整理')}
            </Button>
          )
        }
      />

      {!!bursts?.length && (
        <div className="mt-4">
          <Segmented
            label={tr('连拍的种类')}
            value={current}
            onChange={setTab}
            segments={[
              { value: 'bursts', label: tr('连拍和相似 {v0}', { v0: lists.bursts.length.toLocaleString() }) },
              { value: 'duplicates', label: tr('重复 {v0}', { v0: lists.duplicates.length.toLocaleString() }) },
            ]}
          />
        </div>
      )}
      {error && (
        <p className="mt-6 text-body text-danger">
          {tr('没有读到：')}
          {error}
        </p>
      )}

      {bursts && groups.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center text-muted">
          <Layers className="size-12" strokeWidth={1.2} />
          <p className="mt-3 max-w-md text-body">
            {bursts.length
              ? tr('没有要整理的{label}了。', { label })
              : tr('没有要整理的连拍了。几秒内连着拍的、同一个场景接着拍的几张、同一张存了几份的，会出现在这里。')}
          </p>
        </div>
      )}

      {days.map((day) => (
        <div key={day.key} className="mt-6">
          <h2 className="mb-2 text-heading font-semibold">{day.title}</h2>
          <ul className="flex flex-wrap items-start gap-3">
            {day.groups.map((b) => (
              <BurstGroup
                key={keyOf(b)}
                burst={b}
                keeper={keeperOf(b)}
                busy={busy}
                onPick={pick}
                onCompare={compare}
                onReview={review}
              />
            ))}
          </ul>
        </div>
      ))}
      {hasMore && <div ref={more} className="h-px" />}

      {comparing && (
        <CompareViewer
          burst={comparing.burst}
          start={comparing.index}
          keeper={keeperOf(comparing.burst)}
          onPick={(id) => pick(comparing.burst, id)}
          onClose={() => setComparing(null)}
        />
      )}

      {confirmAll && (
        <Modal
          title={current === 'duplicates' ? tr('全部去重') : tr('全部按推荐整理')}
          onClose={() => setConfirmAll(false)}
        >
          <p className="text-body text-muted">
            {tr('{label}的每组只保留选中的那张（没换过的是推荐的），其余 {n} 张放进「最近删除」，随时可以恢复。', {
              label,
              n: extra.count,
            })}
          </p>
          <DialogActions>
            <DialogButton onClick={() => setConfirmAll(false)}>{tr('取消')}</DialogButton>
            <DialogButton
              variant="primary"
              disabled={busy}
              onClick={() => {
                setConfirmAll(false)
                void review(groups, false)
              }}
            >
              {tr('整理 {n} 组', { n: groups.length })}
            </DialogButton>
          </DialogActions>
        </Modal>
      )}
    </section>
  )
}

// BurstGroup 是一组：照片（多的换行），下面两个小按钮。不写标题，日子在分段上，是哪一类看上面的标签。
// 卡片按照片的多少定宽度，两三张的几组能并排放
// 只有自己这组变了（换了保留哪张）才重画，点一张不会把上千组都重画一遍
const BurstGroup = memo(function BurstGroup({
  burst,
  keeper,
  busy,
  onPick,
  onCompare,
  onReview,
}: {
  burst: Burst
  keeper: string
  busy: boolean
  onPick: (burst: Burst, id: string) => void
  onCompare: (burst: Burst, index: number) => void
  onReview: (targets: Burst[], keepAll: boolean) => Promise<void>
}) {
  return (
    <li className="max-w-full rounded-panel bg-surface p-2.5">
      <div className="flex flex-wrap gap-2">
        {burst.photos.map((p, i) => {
          const kept = p.id === keeper
          return (
            <div key={p.id} className="group relative">
              <button
                type="button"
                onClick={() => onPick(burst, p.id)}
                aria-pressed={kept}
                aria-label={kept ? tr('保留这张') : tr('换成保留这张')}
                className={cx(
                  'relative block size-32 cursor-pointer overflow-hidden rounded-item bg-line transition',
                  kept ? 'ring-3 ring-select' : 'opacity-55 hover:opacity-90',
                )}
              >
                <img
                  src={assetThumbUrl(p.id)}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="size-full object-cover"
                />
                {p.id === burst.best && (
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-micro font-medium text-white backdrop-blur">
                    <Sparkles className="size-3" />
                    {tr('推荐')}
                  </span>
                )}
                {kept && (
                  <span className="absolute right-1.5 bottom-1.5 flex size-6 items-center justify-center rounded-full bg-select text-on-accent shadow">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                )}
                {/* 重复的几份内容一样，只有文件大小不同 */}
                {burst.duplicate && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-micro text-white tabular-nums backdrop-blur">
                    {formatSize(p.size)}
                  </span>
                )}
              </button>
              {!burst.duplicate && (
                <button
                  type="button"
                  onClick={() => onCompare(burst, i)}
                  aria-label={tr('放大对比')}
                  title={tr('放大对比')}
                  className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Maximize2 className="size-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2.5 flex justify-end gap-1.5">
        <CardButton
          disabled={busy}
          onClick={() => void onReview([burst], true)}
          title={tr('这一组都留着，以后不再列出')}
        >
          {tr('都保留')}
        </CardButton>
        <CardButton
          primary
          disabled={busy}
          onClick={() => void onReview([burst], false)}
          title={tr('只留选中的那张，其余放进「最近删除」')}
        >
          {tr('保留')}
        </CardButton>
      </div>
    </li>
  )
})

// CardButton 是卡片下面的按钮：通用 Button 的小号（和设置里表格每行的按钮一样大）
function CardButton({
  children,
  onClick,
  primary,
  disabled,
  title,
}: {
  children: string
  onClick: () => void
  primary?: boolean
  disabled?: boolean
  title: string
}) {
  return (
    <Button small primary={primary} disabled={disabled} onClick={onClick} title={title}>
      {children}
    </Button>
  )
}

// CompareViewer 是放大对比：一张大图，下面一排小图。← → 换一张，空格或回车换成保留这张，Esc 关闭
function CompareViewer({
  burst,
  start,
  keeper,
  onPick,
  onClose,
}: {
  burst: Burst
  start: number
  keeper: string
  onPick: (id: string) => void
  onClose: () => void
}) {
  const [index, setIndex] = useState(start)
  const photo = burst.photos[index]
  const count = burst.photos.length
  const kept = photo.id === keeper

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count)
      else if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count)
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        onPick(burst.photos[index].id)
      } else return
    }
    window.addEventListener('keydown', onKey)
    const unlock = lockScroll()
    return () => {
      window.removeEventListener('keydown', onKey)
      unlock()
    }
  }, [burst, count, index, onClose, onPick])

  const nav = (step: number, Icon: typeof ChevronLeft, label: string, side: string) => (
    <button
      type="button"
      onClick={() => setIndex((i) => (i + step + count) % count)}
      aria-label={label}
      className={cx(
        'absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20',
        side,
      )}
    >
      <Icon className="size-5" />
    </button>
  )

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr('放大对比')}
      className="theme-dark fixed inset-0 z-50 flex flex-col bg-black/95"
    >
      <div className="flex items-center gap-3 px-4 py-3 text-white">
        <span className="text-body tabular-nums">
          {index + 1} / {count}
        </span>
        {photo.id === burst.best && (
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-caption">
            <Sparkles className="size-3" />
            {tr('推荐')}
          </span>
        )}
        <span className="text-caption text-white/60 tabular-nums">{formatSize(photo.size)}</span>
        <div className="flex-1" />
        <Button primary disabled={kept} onClick={() => onPick(photo.id)}>
          <Check className="size-4" strokeWidth={kept ? 3 : 2} />
          {kept ? tr('已保留这张') : tr('换成保留这张')}
        </Button>
        <button
          type="button"
          onClick={onClose}
          aria-label={tr('关闭')}
          className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1 px-16">
        <img
          key={photo.id}
          src={assetPreviewUrl(photo.id)}
          alt=""
          draggable={false}
          className="size-full object-contain"
        />
        {count > 1 && nav(-1, ChevronLeft, tr('上一张'), 'left-3')}
        {count > 1 && nav(1, ChevronRight, tr('下一张'), 'right-3')}
      </div>
      <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3">
        {burst.photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={tr('第 {v0} 张', { v0: i + 1 })}
            aria-current={i === index}
            className={cx(
              'relative size-16 shrink-0 overflow-hidden rounded-item transition',
              i === index ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-90',
            )}
          >
            <img src={assetThumbUrl(p.id)} alt="" draggable={false} className="size-full object-cover" />
            {p.id === keeper && (
              <span className="absolute right-1 bottom-1 flex size-4 items-center justify-center rounded-full bg-select text-on-accent">
                <Check className="size-3" strokeWidth={3} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}
