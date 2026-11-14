import { type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import AlbumDialog from '@/components/albums/AlbumDialog'
import Sidebar, { ACCOUNT_PATH, SETTINGS_PATH } from '@/components/layout/Sidebar'
import { useAlbums } from '@/hooks/useAlbums'
import { usePeople } from '@/hooks/usePeople'
import { usePath } from '@/hooks/usePath'
import { markPageEnter } from '@/lib/pageEnter'
import {
  type Album,
  type AssetStats,
  createAlbum,
  deleteAlbum,
  type Sharing,
  type SmartOptions,
  updateAlbum,
} from '@/lib/api'
import {
  albumPath,
  ALBUMS_PATH,
  BURSTS_PATH,
  DELETED,
  findRoute,
  HIDDEN,
  LIBRARY,
  PEOPLE_PATH,
  PLACES_PATH,
} from '@/lib/views'
import { useCurrentUser } from '@/lib/session'
import AlbumsPage from '@/pages/AlbumsPage'
import PeoplePage from '@/pages/PeoplePage'
import PersonPage from '@/pages/PersonPage'
import PhotosPage from '@/pages/PhotosPage'
import PlacesPage from '@/pages/PlacesPage'
import BurstsPage from '@/pages/BurstsPage'
import SettingsPage from '@/pages/SettingsPage'
import AccountPage from '@/pages/AccountPage'
import { showError } from '@/lib/dialog'
import { SearchScope } from '@/components/photos/GlobalSearch'
import { t } from '@/i18n'

// 相册对话框：新建（可以带上选中的照片）或编辑（重命名、改智能相册的条件）
type AlbumDialogState = { mode: 'create'; assetIds: string[] } | { mode: 'edit'; album: Album }

export default function App() {
  const [stats, setStats] = useState<AssetStats | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  // 上传：队列在照片页里（切到别的页也不中断），照片页把「加进队列」放在这里，左边菜单的上传按钮调用它
  const uploadRef = useRef<((files: FileList | File[]) => void) | null>(null)
  const { albums, refresh: refreshAlbums } = useAlbums()
  const { people, refresh: refreshPeople } = usePeople()
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
      : path === ACCOUNT_PATH
        ? 'account'
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
  // 访客打开了用不了的页面（设置、连拍整理、已隐藏、最近删除，例如别人发来的链接）：回到图库
  const { guest } = useCurrentUser()
  const guestBlocked =
    guest &&
    (page === 'settings' || page === 'account' || page === 'bursts' || path === HIDDEN.path || path === DELETED.path)
  useEffect(() => {
    if (guestBlocked) navigate(LIBRARY.path)
  }, [guestBlocked, navigate])
  const onSettings = page !== 'photos'
  usePageEnter(mainRef, path)

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
        showError(t('删除相册没有成功'), e)
      }
    },
    [navigate, refreshAlbums],
  )

  // 各页顶上的全局搜索框要用的人物列表和跳转（见 GlobalSearch）
  const searchScope = useMemo(() => ({ people: people ?? [], navigate }), [people, navigate])

  // 直接打开相册地址时，等相册列表加载出来再显示，免得先闪一下图库
  const waiting = (albums === null && path.startsWith('/album/')) || (people === null && path.startsWith('/person/'))

  return (
    <SearchScope.Provider value={searchScope}>
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
          navigate={navigate}
          onUpload={(files) => {
            uploadRef.current?.(files)
            if (page !== 'photos') navigate(LIBRARY.path) // 在人物、相册列表这些页上传：回到图库，看得到上传进度
          }}
        />
        <main ref={mainRef} className="min-w-0 flex-1 px-4 pb-16 md:px-8">
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
          {page === 'settings' && <SettingsPage />}
          {page === 'account' && <AccountPage />}
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
    </SearchScope.Provider>
  )
}

const ENTER_MS = 600 // 渐显 320ms，留够时间再去掉标记

// usePageEnter：每次切换页面，标题栏下面的内容渐显出来（index.css 的 page-in）。
// data-enter 在 a、b 之间轮换：动画名变了，留在页面上的元素（例如图库的网格）也会重新播放
function usePageEnter(main: RefObject<HTMLElement | null>, path: string) {
  const first = useRef(true)
  useLayoutEffect(() => {
    const el = main.current
    if (!el) return
    markPageEnter()
    if (first.current) {
      first.current = false // 刚打开网页时不用，照片本来就会一张张淡入
      return
    }
    el.dataset.enter = el.dataset.enter === 'a' ? 'b' : 'a'
    const timer = window.setTimeout(() => delete el.dataset.enter, ENTER_MS)
    return () => clearTimeout(timer)
  }, [main, path])
}
