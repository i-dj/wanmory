// useTimeline 管理照片网格的数据：按当前分类分页加载，滚到底部再加载下一页；
// 上传和处理期间只拉「变化过的照片」合并进来，不用每次重新加载整个列表。

import { useCallback, useEffect, useRef, useState } from 'react'
import { type Asset, assetChanges, type Filter, kindOf, listAssets } from '@/lib/api'
import { getCurrentUserId } from '@/lib/session'

const PAGE_SIZE = 200
const JUMP_PAGE_SIZE = 1000 // 拖时间线跳到很后面时，一次多拿一些，少来回几趟
const RECENT_WINDOW_MS = 30 * 24 * 3600 * 1000 // 和后端的 RecentWindow 一致

// comparator 和后端排序一致：按排序时间新的在前，时间相同按 ID 倒序。
// 「最近添加」用上传时间，「最近删除」用删除时间，其他用拍摄时间（没有就用文件修改时间）。
export function comparator(filter: Filter) {
  // 和服务器的排序一致：排序菜单选了就按它，不然按分类自己的时间；默认从新到旧
  const by = filter.sort ?? (filter.view === 'recent' ? 'added' : filter.view === 'deleted' ? 'deleted' : 'taken')
  const key = (a: Asset) =>
    Date.parse(
      by === 'added'
        ? a.created_at
        : by === 'favorited'
          ? (a.favorited_at ?? a.created_at)
          : by === 'deleted'
            ? (a.deleted_at ?? a.sort_time)
            : a.sort_time,
    )
  const sign = filter.dir === 'asc' ? -1 : 1
  return (a: Asset, b: Asset) => sign * (key(b) - key(a) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
}

// matches 判断照片属不属于这个分类，例如取消收藏后要从「收藏」里拿掉。
// 在不在相册里看不出来，由服务器筛好（看相册时增量刷新只拿相册里的），这里不管。
export function matches(filter: Filter, a: Asset): boolean {
  // 隐藏、删除了的只在「已隐藏」「最近删除」里，其他分类都不显示
  if (filter.view === 'deleted') {
    if (!a.deleted_at) return false
  } else if (a.deleted_at) return false
  else if (a.hidden !== (filter.view === 'hidden') && !(filter.myHidden && a.hidden_by === getCurrentUserId()))
    return false // 自己的私有相册里，自己隐藏的照样显示
  // 别人隐藏的照片不会出现在我的「已隐藏」里（服务器也不给，这里管增量刷新带回来的）
  if (filter.view === 'hidden' && a.hidden_by !== getCurrentUserId()) return false
  if (filter.view === 'recent' && Date.now() - Date.parse(a.created_at) > RECENT_WINDOW_MS) return false
  if (filter.favorite && !a.favorite) return false
  if (filter.kind && kindOf(a) !== filter.kind) return false
  if (filter.kinds?.length && !filter.kinds.includes(kindOf(a)!)) return false
  if (filter.uploaders?.length && !filter.uploaders.includes(a.uploaded_by ?? '')) return false
  if (filter.rating && a.rating !== filter.rating) return false
  // 日期范围按拍摄时间（sort_time 就是拍摄时间，没有时是文件修改时间）
  const taken = Date.parse(a.sort_time)
  if (filter.from && taken < Date.parse(filter.from)) return false
  if (filter.to && taken >= Date.parse(filter.to)) return false
  return true
}

// mergeChanges 把变化过的照片合并进已加载的列表，按分类的顺序重新排好。
// 不再属于这个分类的拿掉；还有后面几页没加载时，排在已加载部分之后的先不放进来，滚到那里加载时自然会出现。
export function mergeChanges(list: Asset[], changed: Asset[], hasMore: boolean, filter: Filter): Asset[] {
  if (changed.length === 0) return list
  const compare = comparator(filter)
  const boundary = hasMore ? list[list.length - 1] : undefined
  const byId = new Map(list.map((a) => [a.id, a]))
  for (const c of changed) {
    if (!matches(filter, c)) byId.delete(c.id)
    else if (byId.has(c.id)) byId.set(c.id, c)
    // 看某个人、搜索结果、某个分类时，变化过的照片属不属于它在网页上看不出来（服务器没按这些筛），新的先不放进来
    else if (!serverOnly(filter) && (!boundary || compare(c, boundary) <= 0)) byId.set(c.id, c)
  }
  return [...byId.values()].sort(compare)
}

// serverOnly：这些条件只有服务器能判断（人脸、照片内容、地点、相机……）
const serverOnly = (f: Filter) => !!(f.person || f.with || f.near || f.city || f.q || f.tag || f.camera || f.lens)

const NO_ASSETS: Asset[] = []

export function useTimeline(filter: Filter) {
  const [assets, setAssetsState] = useState<Asset[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null) // 第一页没加载成功的原因，例如搜索要用的 AI 服务还没准备好
  // 现在的照片是按哪个条件加载的。换了分类后，下面清空的 effect 要等这一帧画完才跑，这一帧里还是旧分类的照片
  // （从图库切到「已隐藏」时先闪一下图库的照片再变空）。条件对不上时当作还没加载，一张也不给
  const [shownKey, setShownKey] = useState<string | null>(null)

  // 异步回调里要读最新值，都放在 ref 里；列表以 listRef 为准，state 只用来触发重新渲染
  const listRef = useRef<Asset[]>([])
  const cursorRef = useRef<string | null>(null)
  const sinceRef = useRef<string | null>(null)
  const inflight = useRef<Promise<void> | null>(null)
  const filterRef = useRef(filter)
  const generation = useRef(0) // 切换分类后，旧分类还没回来的请求结果作废

  const setAssets = useCallback((next: Asset[]) => {
    listRef.current = next
    setAssetsState(next)
  }, [])
  const setCursor = useCallback((cursor: string | null) => {
    cursorRef.current = cursor
    setHasMore(cursor !== null)
  }, [])

  // reload 从最新的照片重新加载第一页
  const reload = useCallback(async () => {
    const gen = generation.current
    const page = await listAssets(filterRef.current, null, PAGE_SIZE)
    if (gen !== generation.current) return
    setAssets(page.items)
    setCursor(page.next_cursor)
    sinceRef.current = page.server_time
    setLoaded(true)
  }, [setAssets, setCursor])

  // 切换分类：清空，重新加载
  const filterKey = JSON.stringify(filter)
  useEffect(() => {
    filterRef.current = JSON.parse(filterKey)
    generation.current++
    inflight.current = null
    sinceRef.current = null
    setAssets([])
    setCursor(null)
    setLoaded(false)
    setLoadingMore(false) // 旧分类还在加载的那一页作废了，它结束时不会再来清这个状态
    setError(null)
    setShownKey(filterKey)
    const gen = generation.current
    reload().catch((e) => {
      console.error(e)
      if (gen === generation.current) setError(e instanceof Error ? e.message : String(e))
    })
  }, [filterKey, reload, setAssets, setCursor])

  // loadMore 加载下一页，接在已加载的后面（去重）。正在加载时返回同一个请求，不会重复拿同一页。
  const loadMore = useCallback(
    (limit = PAGE_SIZE): Promise<void> => {
      if (inflight.current) return inflight.current
      const cursor = cursorRef.current
      if (!cursor) return Promise.resolve()
      const gen = generation.current
      setLoadingMore(true)
      const request = listAssets(filterRef.current, cursor, limit)
        .then((page) => {
          if (gen !== generation.current) return
          const seen = new Set(listRef.current.map((a) => a.id))
          setAssets([...listRef.current, ...page.items.filter((a) => !seen.has(a.id))])
          setCursor(page.next_cursor)
        })
        .finally(() => {
          if (gen !== generation.current) return
          inflight.current = null
          setLoadingMore(false)
        })
      inflight.current = request
      return request
    },
    [setAssets, setCursor],
  )

  // ensureLoaded 一直加载到至少有 count 张（或者没有更多了），时间线跳到还没加载的位置时用。
  const ensureLoaded = useCallback(
    async (count: number) => {
      const gen = generation.current
      while (gen === generation.current && listRef.current.length < count && cursorRef.current) {
        await loadMore(JUMP_PAGE_SIZE)
      }
    },
    [loadMore],
  )

  // refreshChanges 拉取上次之后变化过的照片并合并；变化太多时直接重新加载
  const refreshChanges = useCallback(async () => {
    if (sinceRef.current === null) return
    const gen = generation.current
    const res = await assetChanges(sinceRef.current, filterRef.current.album)
    if (gen !== generation.current) return
    if (res.more) return reload()
    sinceRef.current = res.server_time
    setAssets(mergeChanges(listRef.current, res.items, cursorRef.current !== null, filterRef.current))
  }, [reload, setAssets])

  // applyChanges 把本页面刚改过的照片（例如点了收藏、删除了选中的）合并进列表，不用等下一次增量刷新
  const applyChanges = useCallback(
    (changed: Asset[]) =>
      setAssets(mergeChanges(listRef.current, changed, cursorRef.current !== null, filterRef.current)),
    [setAssets],
  )

  // removeIds 把照片从列表里拿掉，例如从正在看的相册里移除（照片本身没变，增量刷新看不出来）
  const removeIds = useCallback(
    (ids: Iterable<string>) => {
      const drop = new Set(ids)
      setAssets(listRef.current.filter((a) => !drop.has(a.id)))
    },
    [setAssets],
  )

  const stale = shownKey !== filterKey
  return {
    assets: stale ? NO_ASSETS : assets,
    loaded: loaded && !stale,
    error: stale ? null : error,
    hasMore: hasMore && !stale,
    loadingMore: loadingMore && !stale,
    loadMore,
    ensureLoaded,
    refreshChanges,
    applyChanges,
    removeIds,
    reload,
  }
}
