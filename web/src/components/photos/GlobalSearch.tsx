import { createContext, useContext } from 'react'
import type { Person } from '@/lib/api'
import SearchBox from './SearchBox'

// 每一页顶上都有搜索框（全局搜索：在整个图库里搜，结果在 /search/…）。照片页自己放（框里显示正在看的搜索条件），
// 别的页（相册、人物、足迹、连拍整理、设置）用这里的：App 把人物列表和跳转放进 SearchScope，PageHeader 没给 center 时放一个
export const SearchScope = createContext<{ people: Person[]; navigate: (to: string) => void } | null>(null)

export default function GlobalSearch() {
  const scope = useContext(SearchScope)
  if (!scope) return null
  return <SearchBox query={undefined} people={scope.people} navigate={scope.navigate} />
}
