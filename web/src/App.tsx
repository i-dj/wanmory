import { type RefObject, useCallback, useLayoutEffect, useRef, useState } from 'react'
import AlbumDialog from '@/components/albums/AlbumDialog'
import Sidebar, { SETTINGS_PATH } from '@/components/layout/Sidebar'
import { useAlbums } from '@/hooks/useAlbums'
import { usePeople } from '@/hooks/usePeople'
import { usePath } from '@/hooks/usePath'
import { DRAWER_CLOSE_MS, DRAWER_EASE, DRAWER_OPEN_MS, SIDEBAR_WIDTH } from '@/lib/drawer'
import {
  type Album,
  type AssetStats,
  createAlbum,
  deleteAlbum,
  type Sharing,
  type SmartOptions,
  updateAlbum,
} from '@/lib/api'
import { albumPath, ALBUMS_PATH, BURSTS_PATH, findRoute, LIBRARY, PEOPLE_PATH, PLACES_PATH } from '@/lib/views'
import AlbumsPage from '@/pages/AlbumsPage'
import PeoplePage from '@/pages/PeoplePage'
import PersonPage from '@/pages/PersonPage'
import PhotosPage from '@/pages/PhotosPage'
import PlacesPage from '@/pages/PlacesPage'
import BurstsPage from '@/pages/BurstsPage'
import SettingsPage from '@/pages/SettingsPage'
import { showError } from '@/lib/dialog'

// 相册对话框：新建（可以带上选中的照片）或编辑（重命名、改智能相册的条件）
type AlbumDialogState = { mode: 'create'; assetIds: string[] } | { mode: 'edit'; album: Album }

export default function App() {
  const [stats, setStats] = useState<AssetStats | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  // 上传：队列在照片页里（切到别的页也不中断），照片页把「加进队列」放在这里，左边菜单的上传按钮调用它
  const uploadRef = useRef<((files: FileList) => void) | null>(null)
  const { albums, refresh: refreshAlbums } = useAlbums()
  const { people, refresh: refreshPeople } = usePeople()
  // 点进去看照片的页面（左上角有返回的：某个人、足迹里的地方、相册、回忆、搜索结果）收起左边菜单，返回时再展开
  const isDetail = (p: string) => {
    const r = findRoute(p, albums ?? [], people ?? [])
    return !!(r && (r.back || r.person || r.picking))
  }
  const [path, navigate] = usePath()
  const [dialog, setDialog] = useState<AlbumDialogState | null>(null)
  const [justCreated, setJustCreated] = useState<string | null>(null) // 刚建好的相册，打开后自动弹出「添加照片」
  const [albumVersion, setAlbumVersion] = useState(0) // 改了智能相册的条件后加一，照片页据此重新加载
  // 设置页、相册列表、人物列表和人物的「成长」「足迹」「合影」不是照片页；其他地址都是照片页的某个分类
  const route = findRoute(path, albums ?? [], people ?? []) ?? { view: LIBRARY }
  const personTab = route.person && route.tab && route.tab !== 'photos' ? route.tab : null
  const page =
    path === SETTINGS_PATH
      ? 'settings'
      : path === PEOPLE_PATH
        ? 'people'
        : path === ALBUMS_PATH
          ? 'albums'
          : path === PLACES_PATH
            ? 'places'
            : path === BURSTS_PATH
              ? 'bursts'
              : personTab
                ? 'person'
                : 'photos'
  const onSettings = page !== 'photos'
  const detail = isDetail(path)
  useDrawerPush(mainRef, detail)

  // 统计每次刷新时（上传、改了照片之后）顺便刷新相册的数量和封面
  const onStats = useCallback(
    (s: AssetStats) => {
      setStats(s)
      void refreshAlbums()
    },
    [refreshAlbums],
  )

  const closeDialog = useCallback(() => setDialog(null), [])
  const clearJustCreated = useCallback(() => setJustCreated(null), [])
  const submitAlbum = async (name: string, smart?: SmartOptions, sharing?: Sharing & { hide_mine?: boolean }) => {
    if (dialog?.mode === 'create') {
      const album = await createAlbum(name, dialog.assetIds, smart, sharing)
      await refreshAlbums() // 列表里有了它，地址才认得出来
      if (!smart) setJustCreated(album.id) // 普通相册建好后接着弹出「添加照片」
      navigate(albumPath(album.id))
    } else if (dialog?.mode === 'edit') {
      await updateAlbum(dialog.album.id, name, smart)
      await refreshAlbums()
      setAlbumVersion((v) => v + 1) // 条件变了，相册里的照片要重新加载
    }
    setDialog(null)
  }

  const removeAlbum = useCallback(
    async (album: Album) => {
      try {
        await deleteAlbum(album.id)
        navigate(ALBUMS_PATH)
        await refreshAlbums()
      } catch (e) {
        showError('删除相册没有成功', e)
      }
    },
    [navigate, refreshAlbums],
  )

  // 直接打开相册地址时，等相册列表加载出来再显示，免得先闪一下图库
  const waiting = (albums === null && path.startsWith('/album/')) || (people === null && path.startsWith('/person/'))

  return (
    // overflow-x-clip：抽屉动画时页面暂时伸出右边，不出横向滚动条（clip 不是滚动容器，不影响 sticky）
    <div className="min-h-screen overflow-x-clip md:flex">
      <Sidebar
        path={
          route.person
            ? PEOPLE_PATH // 在某个人的照片、成长、足迹、合影里时，侧边栏的「人物」亮着
            : onSettings
              ? path
              : (route.sidebar ?? route.view.path)
        }
        stats={stats}
        collapsed={detail}
        navigate={navigate}
        onUpload={(files) => {
          uploadRef.current?.(files)
          if (page !== 'photos') navigate(LIBRARY.path) // 在人物、相册列表这些页上传：回到图库，看得到上传进度
        }}
      />
      <main ref={mainRef} className="min-w-0 flex-1 px-4 pb-16 md:px-6">
        {/* 照片页一直挂着，只是在设置页、人物页时隐藏：上传队列在里面，切过去也不会中断上传 */}
        <div hidden={onSettings || waiting}>
          <PhotosPage
            route={route}
            albums={albums ?? []}
            active={!onSettings}
            navigate={navigate}
            onStats={onStats}
            onAlbumsChanged={refreshAlbums}
            people={people ?? []}
            onPeopleChanged={refreshPeople}
            onCreateAlbum={(assetIds) => setDialog({ mode: 'create', assetIds })}
            albumVersion={albumVersion}
            autoAddTo={justCreated}
            onAutoAdded={clearJustCreated}
            uploadRef={uploadRef}
          />
        </div>
        {page === 'settings' && (
          <div className="pt-6">
            <SettingsPage />
          </div>
        )}
        {page === 'places' && <PlacesPage navigate={navigate} />}
        {page === 'bursts' && <BurstsPage />}
        {page === 'albums' && (
          <AlbumsPage
            albums={albums}
            navigate={navigate}
            onNew={() => setDialog({ mode: 'create', assetIds: [] })}
            onEdit={(album) => setDialog({ mode: 'edit', album })}
            onDelete={removeAlbum}
            onChanged={refreshAlbums}
          />
        )}
        {page === 'people' && <PeoplePage people={people} navigate={navigate} onChanged={refreshPeople} />}
        {route.person && personTab && (
          <PersonPage
            key={route.person.id}
            person={route.person}
            tab={personTab}
            navigate={navigate}
            onChanged={refreshPeople}
          />
        )}
      </main>
      {dialog && (
        <AlbumDialog
          album={dialog.mode === 'edit' ? dialog.album : undefined}
          count={dialog.mode === 'create' ? dialog.assetIds.length : undefined}
          allowSmart={dialog.mode === 'create' && dialog.assetIds.length === 0}
          albums={albums ?? []}
          onSubmit={submitAlbum}
          onClose={closeDialog}
        />
      )}
    </div>
  )
}

// useDrawerPush：左边菜单收起、展开时，页面跟着平移，像被照片挤走、再推回来（菜单自己的滑动在 Sidebar 里）。
// 布局在这一帧已经换成新的（菜单不占位置了 / 又占回来），页面从原来的位置平移到新位置（FLIP），只动 transform
function useDrawerPush(main: RefObject<HTMLElement | null>, collapsed: boolean) {
  const previous = useRef(collapsed)
  useLayoutEffect(() => {
    if (previous.current === collapsed) return
    previous.current = collapsed
    const el = main.current
    const wide = window.matchMedia('(min-width: 48rem)').matches // 窄屏菜单是顶上一排标签，不收
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!el || !wide || reduce) return
    const sidebar = SIDEBAR_WIDTH
    el.animate([{ transform: `translateX(${collapsed ? sidebar : -sidebar}px)` }, { transform: 'none' }], {
      duration: collapsed ? DRAWER_OPEN_MS : DRAWER_CLOSE_MS,
      easing: DRAWER_EASE,
    })
  }, [main, collapsed])
}
