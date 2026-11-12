import { CircleUserRound, Info, Play } from 'lucide-react'
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import AddPhotosButton from '@/components/albums/AddPhotosButton'
import AlbumHero, { pickHero } from '@/components/albums/AlbumHero'
import type { InfoTarget } from '@/components/photos/AssetTile'
import DatePicker, { type DateRange } from '@/components/photos/DatePicker'
import DropOverlay from '@/components/photos/DropOverlay'
import BatchEditDialog from '@/components/photos/BatchEditDialog'
import { DEFAULT_SORT, FilterMenu, type SortBy, type SortChoice, SortMenu } from '@/components/photos/ViewMenus'
import { AreaFootprint } from '@/components/photos/AreaFootprint'
import HighlightsCarousel from '@/components/photos/HighlightsCarousel'
import MemoriesStrip from '@/components/photos/MemoriesStrip'
import PhotoGrid, { type GridHandle, type VisibleRange } from '@/components/photos/PhotoGrid'
import PhotoInfoCard from '@/components/photos/PhotoInfoCard'
import PhotoInfoPanel from '@/components/photos/PhotoInfoPanel'
import PhotoToolbar from '@/components/photos/PhotoToolbar'
import PhotoViewer from '@/components/photos/PhotoViewer'
import SelectionActions, { DeleteButton } from '@/components/photos/SelectionActions'
import SearchBox from '@/components/photos/SearchBox'
import SelectionBar from '@/components/photos/SelectionBar'
import SelectionCount from '@/components/photos/SelectionCount'
import Slideshow from '@/components/photos/Slideshow'
import TimelineScrubber from '@/components/photos/TimelineScrubber'
import UploadButton from '@/components/photos/UploadButton'
import PersonHero from '@/components/people/PersonHero'
import { PlayButton } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Modal'
import UploadPanel from '@/components/upload/UploadPanel'
import { MenuItem, ToolbarButton } from '@/components/ui/Popover'
import { useElementSize } from '@/hooks/useElementSize'
import { useFileDrop } from '@/hooks/useFileDrop'
import { useGridLayout } from '@/hooks/useGridLayout'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useLibraryStatus } from '@/hooks/useLibraryStatus'
import { useMonthCounts } from '@/hooks/useMonthCounts'
import { usePersisted } from '@/hooks/usePersisted'
import { getFootprintFilter, setFootprintFilter } from '@/lib/footprintFilter'
import { getCurrentUserId, useCurrentUser } from '@/lib/session'
import { useSelection } from '@/hooks/useSelection'
import { useTimeline } from '@/hooks/useTimeline'
import { useUploadQueue } from '@/hooks/useUploadQueue'
import {
  addToAlbum,
  setAvatar,
  type Album,
  type Asset,
  type AssetPatch,
  type AssetStats,
  type AssetSummary,
  downloadAssets,
  type Filter,
  highlights,
  type MediaKind,
  removeFromAlbum,
  isSynced,
  moveFaces,
  type MoveTarget,
  type Person,
  purgeAssets,
  updateAssets,
} from '@/lib/api'
import { cx } from '@/lib/cx'
import { unlockAudio } from '@/lib/musicLibrary'
import { formatCounts } from '@/lib/format'
import { groupByDay, groupByMonth, type Section } from '@/lib/groups'
import { showError } from '@/lib/dialog'
import { albumAddPath, albumPath, LIBRARY, personPath, type Route, type View } from '@/lib/views'
import { t } from '@/i18n'

const BUSY_DELAY = 300 // 批量操作超过这么久（毫秒）才把工具栏按钮变灰

// PhotosPage 显示一个分类（图库、最近添加、收藏、某个星级、某个相册）的照片，并负责上传。
// 给相册挑照片（route.picking）时显示整个图库，选好后点「添加」放进相册。
// 切换分类时这个组件不会重新创建，上传队列和进度都保留。
export default function PhotosPage({
  route,
  albums,
  active,
  navigate,
  onStats,
  onAlbumsChanged,
  people,
  onPeopleChanged,
  onCreateAlbum,
  albumVersion,
  autoAddTo,
  onAutoAdded,
  uploadRef,
}: {
  route: Route
  albums: Album[]
  active: boolean // 当前是不是在看照片页（在设置页时为 false），拖文件进窗口只在这时上传
  navigate: (to: string) => void
  onStats: (stats: AssetStats) => void
  onAlbumsChanged: () => void // 往相册里加减了照片，刷新左侧的数量和封面
  people: Person[]
  onPeopleChanged: () => void // 把照片从某个人移出、移到别人后，刷新人物列表
  onCreateAlbum: (assetIds: string[]) => void
  albumVersion: number // 改了智能相册的条件后变化，重新加载照片
  autoAddTo: string | null // 刚建好的相册，打开时自动弹出「添加照片」
  onAutoAdded: () => void
  uploadRef: RefObject<((files: FileList) => void) | null> // 把「加进上传队列」交给左边菜单的上传按钮
}) {
  const { view, album, person, picking, tab } = route
  const range = useDateRange(view.path + (picking ? ':pick' : ''))
  const grouped = view.layout === 'days'
  // 排序菜单选的（记在浏览器里，各分类通用）。只用在按时间排成一整片的分类上；按日子分组的（最近添加、
  // 已隐藏、最近删除、回忆）有自己的顺序
  const [sortKey, setSortKey] = usePersisted<string>('wanmory.sort', (raw) => raw ?? '')
  // 「收藏」单独记：可以按收藏日期（代替添加日期），默认就是收藏日期、最近收藏的在前
  const [favSortKey, setFavSortKey] = usePersisted<string>('wanmory.sort.favorites', (raw) => raw ?? '')
  const favorites = !!view.filter.favorite && !view.filter.rating && !view.filter.q
  const sortOptions: SortBy[] = favorites ? ['favorited', 'taken'] : ['taken', 'added']
  const defaultSort: SortChoice = favorites ? FAVORITES_SORT : DEFAULT_SORT
  const saved = parseSort(favorites ? favSortKey : sortKey, defaultSort)
  const sort = sortOptions.includes(saved.by) ? saved : defaultSort
  const saveSort = (s: SortChoice) => (favorites ? setFavSortKey : setSortKey)(`${s.by}-${s.dir}`)
  const sortable = !grouped
  // 不是按拍摄时间新的在前时，要告诉服务器怎么排（这时也不显示按日期跳的时间轴）
  const sorted = sortable && (sort.by !== DEFAULT_SORT.by || sort.dir !== DEFAULT_SORT.dir)
  // 筛选菜单勾的类型（照片、视频、动图，可以多选；空的是全部）。换到别的分类时清掉，免得忘了还筛着
  // 按时间排成一片的分类都能筛；那年今天的回忆按日子分组，也能筛（图库里选了成员，回忆也只算他的）
  const filterable = sortable || view.path.startsWith('/memory/')
  // 从足迹点进的城市、地图范围（/places/…）和足迹共用筛选（见 lib/footprintFilter），改了也改回足迹
  const fromPlaces = view.path.startsWith('/places/')
  const [kinds, setKindsState] = useState<MediaKind[]>(() => (fromPlaces ? getFootprintFilter().kinds : []))
  // 筛选菜单选的「成员」（谁传的，可以多选；空的是所有人）
  const [uploaders, setUploadersState] = useState<string[]>(() => (fromPlaces ? getFootprintFilter().uploaders : []))
  const setKinds = (v: MediaKind[]) => {
    setKindsState(v)
    if (fromPlaces) setFootprintFilter({ kinds: v })
  }
  const setUploaders = (v: string[]) => {
    setUploadersState(v)
    if (fromPlaces) setFootprintFilter({ uploaders: v })
  }
  // 换到别的分类时清掉，免得忘了还筛着；从图库点进那年今天的回忆、再回来时留着（回忆是按筛选找的）
  const lastPath = useRef(view.path)
  useEffect(() => {
    if (lastPath.current === view.path) return
    const keep = (p: string) => p === LIBRARY.path || p.startsWith('/memory/')
    if (view.path.startsWith('/places/')) {
      const f = getFootprintFilter()
      setKindsState(f.kinds)
      setUploadersState(f.uploaders)
    } else if (!(keep(lastPath.current) && keep(view.path))) {
      setKindsState([])
      setUploadersState([])
    }
    lastPath.current = view.path
  }, [view.path])
  const filter = useMemo<Filter>(() => {
    const f: Filter = range.value ? { ...view.filter, from: range.value.from, to: range.value.to } : { ...view.filter }
    if (filterable && !picking && kinds.length) f.kinds = kinds
    if (filterable && !picking && uploaders.length) f.uploaders = uploaders
    // 自己的私有相册、人物页、足迹里，自己隐藏了的照样显示
    if ((album?.private && album.owner === getCurrentUserId()) || f.person || f.city || f.near) f.myHidden = true
    if (sorted) {
      f.sort = sort.by
      if (sort.dir === 'asc') f.dir = 'asc'
    }
    return f
  }, [view.filter, range.value, filterable, picking, kinds, uploaders, sorted, sort.by, sort.dir, album])

  // 数据：照片列表、上传、统计
  const timeline = useTimeline(filter)
  const refreshRef = useRef<() => Promise<void>>(async () => {})
  const uploads = useUploadQueue(() => refreshRef.current())
  const status = useLibraryStatus({ filter, busy: uploads.busy, refreshChanges: timeline.refreshChanges, onStats })
  useEffect(() => {
    refreshRef.current = status.refresh
  }, [status.refresh])
  // 智能相册的条件改了：照片和概要重新加载（第一次渲染时不用）
  const { reload } = timeline
  const firstVersion = useRef(albumVersion)
  useEffect(() => {
    if (albumVersion === firstVersion.current) return
    void reload()
    void refreshRef.current()
  }, [albumVersion, reload])

  // 布局：网格尺寸、看得见的范围、时间线
  const toolbarRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(gridRef)
  const { height: toolbarHeight } = useElementSize(toolbarRef)
  const layout = useGridLayout(width)
  const gridHandle = useRef<GridHandle>(null)
  const [visible, setVisible] = useState<VisibleRange | null>(null)
  // 日历和右边的时间线：按日子分组的分类（回忆、相册里一段段的）不要，「最近添加」要（按上传的日子分）
  const byUploadDay = view.filter.view === 'recent'
  const dated = !grouped || byUploadDay
  // 右边的时间线和照片的排序一致：按添加日期排就按上传的月份，从旧到新排时时间线也倒过来（见下面 months）
  const showScrubber = dated && !range.value
  const viewMenus = !picking && (
    <>
      {sortable && <SortMenu value={sort} options={sortOptions} defaultValue={defaultSort} onChange={saveSort} />}
      {filterable && <FilterMenu value={kinds} onChange={setKinds} uploaders={uploaders} onUploaders={setUploaders} />}
    </>
  )
  const monthFilter = useMemo<Filter>(
    () => (sorted ? { ...view.filter, sort: sort.by } : view.filter),
    [view.filter, sorted, sort.by],
  )
  const counts = useMonthCounts(monthFilter, showScrubber, status.stats?.total ?? 0, byUploadDay ? 'day' : 'month')
  // 服务器给的是从新到旧；照片从旧到新排时倒过来，时间线上的位置才对得上
  const months = useMemo(
    () => (sorted && sort.dir === 'asc' ? [...counts].reverse() : counts),
    [counts, sorted, sort.dir],
  )

  useInfiniteScroll(sentinelRef, {
    enabled: timeline.hasMore,
    count: timeline.assets.length,
    loadMore: timeline.loadMore,
  })

  // 时间线拖动时直接滚到那个位置（已经加载的部分），位置带小数，页面连续地移动
  const scrubTo = useCallback((position: number) => gridHandle.current?.scrollToPosition(position), [])
  // 时间线跳到第 index 张：还没加载到那里的先加载，等网格画出来再滚过去
  const { ensureLoaded, applyChanges } = timeline
  const jumpTo = useCallback(
    async (index: number) => {
      await ensureLoaded(index + 1)
      await nextPaint()
      gridHandle.current?.scrollToPosition(index)
    },
    [ensureLoaded],
  )

  // 交互：悬停信息卡、拖放上传、收藏和星级
  // 照片信息卡：在照片的「更多」菜单里点「照片信息」时出现，点哪里、滚动或按 Esc 都收起
  const [info, setInfo] = useState<InfoTarget>(null)
  const hideInfo = useCallback(() => setInfo(null), [])
  useDismissInfo(info !== null, hideInfo)
  // 在相册里上传（按钮或拖进窗口）的，传完直接放进这个相册
  const synced = !!album && isSynced(album) // 按条件自动同步的智能相册，不能手动加减照片
  const uploadAlbum = album && !synced ? album.id : undefined
  const addFiles = useCallback(
    (files: FileList) => uploads.queue.add(Array.from(files), { album: uploadAlbum }),
    [uploads.queue, uploadAlbum],
  )
  useEffect(() => {
    uploadRef.current = addFiles
  }, [uploadRef, addFiles])
  const [viewing, setViewing] = useState<string | null>(null) // 大图查看器是从哪张打开的
  const [viewerList, setViewerList] = useState<Asset[] | null>(null) // 从精选轮播打开时只在精选里前后翻，不然是网格里的照片
  const viewerCurrent = useRef<string | null>(null) // 查看器里现在看的是哪张
  const setViewerCurrent = useCallback((id: string) => {
    viewerCurrent.current = id
  }, [])
  const { updateUser, guest } = useCurrentUser() // guest：访客只能浏览，不能选、上传、改
  const dragging = useFileDrop(active && !viewing && !guest, addFiles)
  const { refresh } = status
  const onChanged = useCallback(
    (asset: Asset) => {
      applyChanges([asset])
      void refresh() // 左侧的收藏数、星级数和标题下的概要也跟着变
    },
    [applyChanges, refresh],
  )

  // 多选和选中后的批量操作
  const selection = useSelection(timeline.assets, JSON.stringify(filter) + (picking?.id ?? ''))
  useSelectionKeys(selection.clear, selection.selectAll)
  useClearOnBlankClick(active, selection.clear)
  const toast = useToast()
  // 「设为我的头像」：照片（有缩略图、没删的）的「更多」菜单里，选中一张时和大图查看器里都有
  const avatarItem = (asset: Asset) =>
    asset.type === 'image' && asset.has_thumbnail && !asset.deleted_at
      ? (close: () => void) => (
          <MenuItem
            icon={CircleUserRound}
            label={t('设为我的头像')}
            onClick={async () => {
              close()
              try {
                const { user } = await setAvatar(asset.id)
                updateUser(user)
                toast.show(t('头像换好了'))
              } catch (e) {
                toast.show(t('头像没有换成功：{v0}', { v0: e instanceof Error ? e.message : e }))
              }
            }}
          />
        )
      : undefined
  const [saving, setSaving] = useState(false)
  // run 执行一个批量操作：失败弹出提示，返回成功没有。超过 BUSY_DELAY 还没做完时按钮才变灰、不能点，
  // 标星、收藏这种一下就好的操作，工具栏不会闪一下
  const run = async (action: () => Promise<void>) => {
    const busy = window.setTimeout(() => setSaving(true), BUSY_DELAY)
    try {
      await action()
      return true
    } catch (e) {
      showError(t('操作没有成功'), e)
      return false
    } finally {
      window.clearTimeout(busy)
      setSaving(false)
    }
  }
  // 下面这些操作选中的照片，大图查看器里操作当前那一张
  const selectedIds = () => [...selection.selected]
  const applyTo = (ids: string[], patch: AssetPatch) =>
    run(async () => {
      applyChanges(await updateAssets(ids, patch)) // 删除、隐藏了的从列表里拿掉，选中的也跟着拿掉
      void refresh()
    })
  const addTo = (target: Album, ids: string[]) =>
    run(async () => {
      await addToAlbum(target.id, ids)
      toast.show(t('已添加到「{name}」', { name: target.name }))
      onAlbumsChanged()
    })
  const removeFrom = (target: Album, ids: string[]) =>
    run(async () => {
      await removeFromAlbum(target.id, ids)
      if (target.id === album?.id) timeline.removeIds(ids) // 正在看这个相册，照片从列表里拿掉
      onAlbumsChanged()
      void refresh()
    })
  const removeFromCurrentAlbum = (ids: string[]) => album && removeFrom(album, ids)

  // 批量调整拍摄时间、修改位置（「更多」菜单里，见 BatchEditDialog）
  const [batchEdit, setBatchEdit] = useState<'date' | 'location' | null>(null)
  // 看某个人的照片时，把选中照片里他的脸移出（不是他）或者移到别人，这些照片从当前列表里拿掉
  const moveToPerson = (ids: string[], target: MoveTarget) =>
    person &&
    run(async () => {
      const res = await moveFaces(person.id, ids, target)
      timeline.removeIds(ids)
      onPeopleChanged()
      void refresh()
      const to = target && 'person' in target ? people.find((p) => p.id === target.person) : null
      toast.show(
        target === null
          ? t('已从「{v0}」移除 {length} 张', { v0: person.name || t('这个人'), length: ids.length })
          : to
            ? t('已移到「{v0}」', { v0: to.name || t('未命名的人') })
            : t('已移到一个新的人物（{moved} 张脸）', { moved: res.moved }),
      )
    })
  // 「最近删除」里永久删除：选中的几张（ids），或者不传就是全部。原始文件也从磁盘上删掉
  const purge = (ids?: string[]) =>
    run(async () => {
      const res = await purgeAssets(ids)
      if (ids) timeline.removeIds(ids)
      else await timeline.reload()
      void refresh()
      toast.show(
        res.failed_files > 0
          ? t('已永久删除 {deleted} 项，有 {failed_files} 个文件没能从磁盘上删掉', {
              deleted: res.deleted,
              failed_files: res.failed_files,
            })
          : t('已永久删除 {deleted} 项', { deleted: res.deleted }),
      )
    })
  // 按数字键 1–5 标星、0 清除：大图查看器开着时标当前那张，不然标选中的几张，标完弹一个提示
  const rateByKey = (rating: number) => {
    const ids = viewing ? [viewerCurrent.current ?? viewing] : selectedIds()
    if (!ids.length || picking || scopeOf(filter) === 'deleted') return
    void applyTo(ids, { rating }).then(
      (ok) =>
        ok &&
        toast.show(
          (rating ? `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}` : t('已清除星级')) +
            (ids.length > 1 ? t(' · {length} 张', { length: ids.length }) : ''),
        ),
    )
  }
  useRatingKeys(rateByKey, !!viewing)
  // 挑选模式：把选中的放进相册，回到相册
  const addPicked = () =>
    picking &&
    run(async () => {
      await addToAlbum(picking.id, selectedIds())
      onAlbumsChanged()
      navigate(albumPath(picking.id))
    })
  const selecting = selection.selectedAssets.length > 0

  // 按日子分组的分类（最近添加、已隐藏、最近删除、回忆）按日子分；按拍摄时间排成一片的（图库、收藏、相册、人物……）按月分，
  // 每个月上面一行「2026年11月」，按排序菜单选的时间分（拍摄、添加、收藏日期）
  const byMonth = !grouped
  const sections: Section[] = useMemo(
    () =>
      grouped && view.dayOf
        ? groupByDay(timeline.assets, view.dayOf)
        : byMonth
          ? groupByMonth(timeline.assets, sort.by)
          : [{ key: 'all', assets: timeline.assets }],
    [grouped, byMonth, view.dayOf, timeline.assets, sort.by],
  )
  const empty = timeline.loaded && timeline.assets.length === 0
  const total = status.summary ? status.summary.photos + status.summary.videos : timeline.assets.length

  // 大图查看器：按网格里的顺序前后翻；关闭时停在的那张要是不在窗口里，网格滚过去
  const ordered = useMemo(() => sections.flatMap((s) => s.assets), [sections])
  const openViewer = useCallback((asset: Asset, list: Asset[] | null = null) => {
    viewerCurrent.current = asset.id
    setViewerList(list)
    setViewing(asset.id)
  }, [])
  const closeViewer = useCallback(
    (lastId: string | null) => {
      setViewing(null)
      const i = lastId ? ordered.findIndex((a) => a.id === lastId) : -1
      if (i >= 0 && visible && (i < visible.first || i > visible.last))
        requestAnimationFrame(() => gridHandle.current?.scrollToPosition(i))
    },
    [ordered, visible],
  )
  const loadViewerMore = useCallback((count: number) => void ensureLoaded(count), [ensureLoaded])

  // 工具栏上的播放和信息，和大图查看器顶栏上的一样。
  // 播放：选了几张就只放这几张，选了一张从它开始往后放，没选就从头放整个分类
  const [slideshow, setSlideshow] = useState<{ only: Asset[] | null; start: number } | null>(null)
  const playSlideshow = () => {
    unlockAudio() // 必须在这次点击里同步解锁声音，见 PhotoViewer
    const chosen = selection.selectedAssets
    if (chosen.length > 1) setSlideshow({ only: chosen, start: 0 })
    else
      setSlideshow({ only: null, start: Math.max(0, chosen[0] ? ordered.findIndex((a) => a.id === chosen[0].id) : 0) })
  }
  // 信息：只选了一张时在右边打开信息栏，换选别的照片时跟着换，选的不是一张就收起
  const [infoOpen, setInfoOpen] = useState(false)
  // 取消选择（点 ×、按 Esc、点空白处）时信息栏也一起收起，下次选中照片不会自己弹出来
  useEffect(() => {
    if (!selecting) setInfoOpen(false)
  }, [selecting])
  const infoAsset = selection.selectedAssets.length === 1 ? selection.selectedAssets[0] : null
  const infoShown = infoOpen && !!infoAsset && !viewing
  // 播放按钮一进页面就在（照片还没加载出来时点不了），不等照片出来才冒出来把旁边的按钮挤走
  const showPlay = !picking && filter.view !== 'deleted'
  const canPlay = showPlay && ordered.length > 0

  // 相册顶上的横幅：第一页照片读到后挑一次，记住是哪个相册的；往下滚加载更多时不换，免得横幅突然变样
  const [hero, setHero] = useState<{ album: string; asset: Asset } | null>(null)
  useEffect(() => {
    if (!album || hero?.album === album.id || timeline.assets.length === 0) return
    const asset = pickHero(timeline.assets)
    if (asset) setHero({ album: album.id, asset })
  }, [album, hero, timeline.assets])
  // 选了日期时看的是其中一段，标题是那段时间，不放横幅
  const heroAsset = album && !picking && !range.value && hero?.album === album.id ? hero.asset : null

  return (
    <div
      // 时间线从固定栏下面开始
      style={{ '--toolbar-height': `${toolbarHeight + 8}px` } as React.CSSProperties}
      // 信息栏开着时网格和工具栏让出右边，按钮不被挡住
      className={cx(infoShown && 'md:pr-90')}
    >
      <PhotoToolbar
        ref={toolbarRef}
        layout={layout}
        title={picking ? t('添加到「{name}」', { name: picking.name }) : pageTitle(view, range.value)}
        hideTitle={!!heroAsset} // 相册名和数量写在横幅上
        subtitle={
          picking
            ? t('点选或拖框选择照片，选好后点右上角的「添加」')
            : status.summary
              ? pageSubtitle(view, status.summary)
              : ''
        }
        // 人物的照片：标题的位置换成头像、名字、统计和四个标签
        hero={
          person &&
          tab === 'photos' && (
            <PersonHero person={person} tab="photos" navigate={navigate} onChanged={onPeopleChanged} />
          )
        }
        menus={
          <>
            {dated && <DatePicker filter={view.filter} selected={range.value} onSelect={range.set} />}
            {viewMenus}
          </>
        }
        search={!picking && <SearchBox query={route.search} people={people} navigate={navigate} />}
        titleAction={
          <>
            {range.value && (
              <button
                type="button"
                onClick={() => range.set(null)}
                className="shrink-0 text-body text-accent hover:underline"
              >
                {t('显示全部')}
              </button>
            )}
          </>
        }
        tools={
          showPlay && !selecting && <PlayButton label={t('幻灯片播放')} disabled={!canPlay} onClick={playSlideshow} />
        }
        actions={
          !guest && picking ? (
            <PickActions
              count={selection.selectedAssets.length}
              busy={saving}
              onCancel={() => navigate(albumPath(picking.id))}
              onAdd={addPicked}
            />
          ) : synced ? null : album ? (
            <AddPhotosButton
              autoOpen={autoAddTo === album.id}
              onAutoOpened={onAutoAdded}
              onPickFromLibrary={() => navigate(albumAddPath(album.id))}
              onFiles={addFiles}
            />
          ) : filter.view === 'deleted' ? (
            total > 0 && (
              <DeleteButton
                assets={timeline.assets.slice(0, 3)}
                total={total}
                permanent
                label={t('全部永久删除')}
                disabled={saving}
                onConfirm={() => purge()}
              />
            )
          ) : (
            // 宽屏上上传在左边菜单顶上，这里只给窄屏留一个
            <span className="md:hidden">
              <UploadButton onFiles={addFiles} />
            </span>
          )
        }
        aside={picking && selecting && <SelectionCount assets={selection.selectedAssets} />}
      />

      {selecting && !picking && !guest && (
        // 选中后操作栏浮在底部中间，不占顶上的工具栏
        <SelectionBar count={selection.selectedAssets.length} onClear={selection.clear}>
          {canPlay && <ToolbarButton icon={Play} label={t('播放选中的')} onClick={playSlideshow} />}
          {scopeOf(filter) !== 'deleted' && (
            <ToolbarButton
              icon={Info}
              label={infoAsset ? t('信息') : t('信息（只选一张时）')}
              pressed={infoOpen && !!infoAsset}
              disabled={!infoAsset}
              onClick={() => setInfoOpen((o) => !o)}
            />
          )}
          <SelectionActions
            assets={selection.selectedAssets}
            scope={scopeOf(filter)}
            busy={saving}
            albums={albums}
            album={album}
            onApply={(patch) => applyTo(selectedIds(), patch)}
            onDownload={() => downloadAssets(selectedIds())}
            onAddToAlbum={(target) => addTo(target, selectedIds())}
            onCreateAlbum={() => onCreateAlbum(selectedIds())}
            onRemoveFromAlbum={() => removeFromCurrentAlbum(selectedIds())}
            onPurge={() => purge(selectedIds())}
            person={person}
            people={people}
            onMovePerson={(target) => moveToPerson(selectedIds(), target)}
            onEditDate={scopeOf(filter) === 'deleted' ? undefined : () => setBatchEdit('date')}
            onEditLocation={scopeOf(filter) === 'deleted' ? undefined : () => setBatchEdit('location')}
            menuExtra={selection.selectedAssets.length === 1 ? avatarItem(selection.selectedAssets[0]) : undefined}
          />
        </SelectionBar>
      )}
      {view.path === LIBRARY.path && !picking && !range.value && (
        <>
          <HighlightsCarousel
            filter={{ kinds: filter.kinds, uploaders: filter.uploaders }}
            onOpen={(list, i) => openViewer(list[i], list)}
            onPlay={() => {
              unlockAudio() // 必须在这次点击里同步解锁声音，见 PhotoViewer
              highlights({ kinds: filter.kinds, uploaders: filter.uploaders }, 100, true).then(
                (list) => list.length > 0 && setSlideshow({ only: list, start: 0 }),
                (e) => showError(t('没有读到精选照片'), e),
              )
            }}
          />
          <MemoriesStrip navigate={navigate} filter={{ kinds: filter.kinds, uploaders: filter.uploaders }} />
        </>
      )}
      {album && heroAsset && (
        <AlbumHero album={album} asset={heroAsset} summary={status.summary ? pageSubtitle(view, status.summary) : ''} />
      )}
      {view.filter.near && view.path.startsWith('/places/') && (
        <AreaFootprint key={view.path} box={view.filter.near} city={view.filter.city} navigate={navigate} />
      )}
      {timeline.error && <p className="mt-6 text-body text-danger">{timeline.error}</p>}
      {empty && (
        <p className="mt-6 text-body text-muted">
          {range.value
            ? t('{label}没有照片。', { label: range.value.label })
            : filter.kinds || filter.uploaders
              ? t('没有符合筛选条件的照片。')
              : view.empty}
        </p>
      )}

      <PhotoGrid
        ref={gridRef}
        handle={gridHandle}
        stickyHeader={toolbarRef}
        sections={sections}
        layout={layout}
        // 人物、相册里拼贴排版，好看的放大；挑照片放进相册时还是整齐的
        mosaic={!picking && !!(view.filter.person || view.filter.album)}
        markHidden={view.filter.view !== 'hidden'}
        selected={selection.selected}
        onVisibleChange={setVisible}
        // 给相册挑照片时单击是选上 / 取消，不打开大图
        onOpen={
          picking ? (asset) => selection.click(asset, { toggle: true, range: false }) : (asset) => openViewer(asset)
        }
        onInfo={setInfo}
        onChanged={onChanged}
        onSelect={guest ? undefined : selection.click}
        onMarquee={guest ? undefined : selection.marquee}
        readOnly={guest}
      />
      <div ref={sentinelRef} aria-hidden="true" />
      {timeline.loadingMore && <p className="py-4 text-center text-body text-muted">{t('加载中…')}</p>}

      {showScrubber && (
        <TimelineScrubber
          months={months}
          unit={byUploadDay ? 'day' : 'month'}
          visible={visible}
          loaded={timeline.assets.length}
          onScrub={scrubTo}
          onJump={jumpTo}
        />
      )}
      <UploadPanel items={uploads.items} queue={uploads.queue} />
      {batchEdit && (
        <BatchEditDialog
          kind={batchEdit}
          assets={selection.selectedAssets}
          onSaved={(changed) => {
            applyChanges(changed)
            void refresh()
          }}
          onClose={() => setBatchEdit(null)}
        />
      )}
      {info && <PhotoInfoCard asset={info.asset} anchor={info.anchor} />}
      {dragging && <DropOverlay />}
      {infoShown && infoAsset && (
        // 浮在网格右边；点信息栏里面不取消选择
        <div data-keep-selection className="fixed inset-y-0 right-0 z-36 flex">
          <PhotoInfoPanel
            key={infoAsset.id} // 换了一张就整个重来：地图、编辑框、滚动位置都不留上一张的
            asset={infoAsset}
            albums={albums}
            onChanged={onChanged}
            onOpenAlbum={(target) => navigate(albumPath(target.id))}
            onOpenPerson={(id) => navigate(personPath(id))}
            onRemoveFromAlbum={async (target) => void (await removeFrom(target, [infoAsset.id]))}
            onClose={() => setInfoOpen(false)}
          />
        </div>
      )}
      {slideshow &&
        createPortal(
          <Slideshow
            assets={slideshow.only ?? ordered}
            startIndex={slideshow.start}
            onLoadMore={slideshow.only ? () => {} : loadViewerMore}
            onClose={() => setSlideshow(null)}
          />,
          document.body,
        )}
      {viewing && (
        <PhotoViewer
          assets={viewerList ?? ordered}
          startId={viewing}
          total={viewerList ? viewerList.length : status.summary ? status.summary.photos + status.summary.videos : null}
          onLoadMore={viewerList ? () => {} : loadViewerMore}
          albums={albums}
          onChanged={onChanged}
          onOpenAlbum={(target) => {
            setViewing(null)
            navigate(albumPath(target.id))
          }}
          onOpenPerson={(id) => {
            setViewing(null)
            navigate(personPath(id))
          }}
          onRemoveFromAlbum={async (asset, target) => void (await removeFrom(target, [asset.id]))}
          onCurrent={setViewerCurrent}
          onClose={closeViewer}
          // 顶栏右边的按钮和选中照片后工具栏上的一样，操作当前这一张；删除、隐藏后查看器自动换到下一张
          actions={(asset, menuExtra) =>
            guest ? null : (
              <SelectionActions
                assets={[asset]}
                scope={scopeOf(filter)}
                busy={saving}
                albums={albums}
                album={album}
                onApply={(patch) => applyTo([asset.id], patch)}
                onDownload={() => downloadAssets([asset.id])}
                onAddToAlbum={(target) => addTo(target, [asset.id])}
                onCreateAlbum={() => onCreateAlbum([asset.id])}
                onRemoveFromAlbum={() => removeFromCurrentAlbum([asset.id])}
                onPurge={() => purge([asset.id])}
                person={person}
                people={people}
                onMovePerson={(target) => moveToPerson([asset.id], target)}
                menuExtra={(close) => (
                  <>
                    {menuExtra(close)}
                    {avatarItem(asset)?.(close)}
                  </>
                )}
              />
            )
          }
        />
      )}
      {toast.message && (
        <div
          role="status"
          // 大图查看器开着时放在缩略图条上面
          className={cx(
            'popover-card fixed left-1/2 z-50 -translate-x-1/2 rounded-full bg-fg px-4 py-2 text-body font-medium text-page shadow-lg',
            viewing ? 'bottom-28' : 'bottom-6',
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

// PickActions 是给相册挑照片时工具栏右边的「取消」和「添加 N 项」
function PickActions({
  count,
  busy,
  onCancel,
  onAdd,
}: {
  count: number
  busy: boolean
  onCancel: () => void
  onAdd: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Button onClick={onCancel}>{t('取消')}</Button>
      <Button primary disabled={count === 0 || busy} onClick={onAdd}>
        {count > 0 ? t('添加 {count} 项', { count }) : t('添加')}
      </Button>
    </div>
  )
}

// useToast 是页面底部一闪而过的提示，例如「已添加到「旅行」」
function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const show = useCallback((text: string) => {
    setMessage(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMessage(null), 2200)
  }, [])
  return { message, show }
}

// useDateRange 是在日历里选的一段时间，换分类（key 变了）时自动清掉。
function useDateRange(key: string) {
  const [state, setState] = useState<{ key: string; value: DateRange | null }>({ key, value: null })
  const value = state.key === key ? state.value : null
  const set = useCallback((value: DateRange | null) => setState({ key, value }), [key])
  return { value, set }
}

// useRatingKeys：按 1–5 标星、0 清除。在输入框里、开着菜单或对话框（大图查看器本身除外）时不管
function useRatingKeys(rate: (rating: number) => void, viewing: boolean) {
  const rateRef = useRef(rate)
  useEffect(() => {
    rateRef.current = rate
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!/^[0-5]$/.test(e.key) || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest('input, textarea, select, [contenteditable]')) return
      const dialogs = document.querySelectorAll('[role="dialog"]').length
      if (document.querySelector('[role="menu"]') || dialogs > (viewing ? 1 : 0)) return
      rateRef.current(Number(e.key))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [viewing])
}

// useSelectionKeys：Esc 取消选择，⌘A / Ctrl+A 全选已经加载的照片。在输入框里、或有菜单、对话框弹出时不管
function useSelectionKeys(clear: () => void, selectAll: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof Element ? e.target : null
      if (
        target?.closest('input, textarea, [contenteditable]') ||
        document.querySelector('[role="menu"], [role="dialog"]')
      )
        return
      if (e.key === 'Escape') clear()
      else if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        selectAll()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [clear, selectAll])
}

// useClearOnBlankClick：点页面上的空白处（照片之间的缝、完整比例模式下照片旁边的留边、工具栏的空白……）取消选择。
// 点到按钮、链接、输入框、菜单、对话框，或者标了 data-keep-selection 的区域（例如上传面板）时不取消
function useClearOnBlankClick(enabled: boolean, clear: () => void) {
  useEffect(() => {
    if (!enabled) return
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return
      const target = e.target as Element
      if (
        target.closest(
          'button, a, input, textarea, select, label, [role="menu"], [role="dialog"], [data-keep-selection]',
        )
      )
        return
      clear()
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [enabled, clear])
}

// scopeOf 是这个分类看的是平时的照片、隐藏了的还是删除了的，决定选中后有哪些操作
function scopeOf(filter: Filter) {
  return filter.view === 'hidden' ? 'hidden' : filter.view === 'deleted' ? 'deleted' : 'normal'
}

// useDismissInfo：信息卡出现后，滚动（位置会对不上）、点页面上任何地方、按 Esc 都收起
function useDismissInfo(shown: boolean, hide: () => void) {
  useEffect(() => {
    if (!shown) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide()
    window.addEventListener('scroll', hide, { passive: true })
    window.addEventListener('pointerdown', hide)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', hide)
      window.removeEventListener('pointerdown', hide)
      window.removeEventListener('keydown', onKey)
    }
  }, [shown, hide])
}

// pageTitle 是大标题：选了日期就是那段时间，图库是「全部照片」，其他分类、相册就是名字。
// 不跟着滚动换成屏幕上照片的日期（看着乱，标题宽度变来变去还像在抖）；现在看到哪天在右边的时间线上
function pageTitle(view: View, range: DateRange | null): string {
  if (range) return range.label
  return view.path === LIBRARY.path ? t('全部照片') : view.title
}

// pageSubtitle：「34 张照片、1 个视频 · 2.3 GB」，前面加上分类的说明（例如「最近 30 天」）。
function pageSubtitle(view: View, summary: AssetSummary): string {
  const counts = formatCounts(summary)
  return [view.note, counts].filter(Boolean).join(' · ')
}

// nextPaint 等 React 把新加载的照片画出来，页面变高之后才能滚过去
const nextPaint = () => new Promise<void>((resolve) => setTimeout(resolve, 32))

const FAVORITES_SORT: SortChoice = { by: 'favorited', dir: 'desc' } // 「收藏」默认：最近收藏的在前

// parseSort 读记在浏览器里的排序（「taken-desc」「favorited-asc」），没记过的用 fallback
function parseSort(key: string, fallback: SortChoice): SortChoice {
  const [by, dir] = key.split('-')
  if (by !== 'taken' && by !== 'added' && by !== 'favorited') return fallback
  return { by, dir: dir === 'asc' ? 'asc' : 'desc' }
}
