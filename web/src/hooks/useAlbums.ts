import { useCallback, useEffect, useState } from 'react'
import { type Album, listAlbums } from '@/lib/api'

// useAlbums 是所有相册的列表（左侧边栏、「添加到相册」菜单用）。还没加载出来时是 null。
// refresh 在新建、改名、删除相册，或者往相册里加减照片之后调用。
export function useAlbums() {
  const [albums, setAlbums] = useState<Album[] | null>(null)
  const refresh = useCallback(async () => {
    try {
      setAlbums(await listAlbums())
    } catch (e) {
      console.error('读取相册失败', e)
      setAlbums((prev) => prev ?? []) // 第一次就失败也要让页面显示出来
    }
  }, [])
  useEffect(() => {
    void refresh()
  }, [refresh])
  return { albums, refresh }
}
