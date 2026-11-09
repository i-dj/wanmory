import { useCallback, useMemo } from 'react'
import { usePersisted } from './usePersisted'

// 照片之间的缝：照片按原比例排满一行，像 Windows「照片」一样留一道窄缝、每张小圆角，一张张分得清又不散
const GAP = 8
const MIN_TILE = 60 // 像素，照片再小就看不清了，决定窄屏上最多几列
const MAX_COLUMNS = 10 // 缩到最小时大约每行 10 张（窗口窄时按 MIN_TILE 再少一些）
const MIN_COLUMNS = 2 // 放到最大时大约每行 2 张
const DEFAULT_COLUMNS = 5
const NARROW_DEFAULT_COLUMNS = 3 // 手机上第一次打开时大约每行 3 张
const NARROW_WIDTH = 640

export interface GridLayout {
  width: number // 网格的宽度（像素）
  gap: number
  columns: number
  minColumns: number
  maxColumns: number
  setColumns: (columns: number) => void
  stepColumns: (delta: number) => void // +1 照片变小（每行多放一张左右），−1 变大
  rowHeight: number // 每行的目标高度（像素）：照片按原比例排，一行排满后整行缩到正好铺满宽度，所以实际不会超过它
}

// useGridLayout 管理网格的大小：缩放滑块调的是「大约每行几张」，换算成每行的目标高度（正方形时一行正好这么多张），
// 记在浏览器里。窗口窄放不下时临时变小，窗口变宽后恢复。
export function useGridLayout(width: number): GridLayout {
  const [preferred, setPreferred] = usePersisted<number>('wanmory.columns', (raw) => {
    const n = Number(raw)
    if (raw && Number.isInteger(n)) return n
    return window.innerWidth < NARROW_WIDTH ? NARROW_DEFAULT_COLUMNS : DEFAULT_COLUMNS
  })

  const maxColumns = Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, Math.floor((width + GAP) / (MIN_TILE + GAP))))
  const clamp = useCallback((n: number) => Math.min(maxColumns, Math.max(MIN_COLUMNS, n)), [maxColumns])
  const columns = clamp(preferred)
  const rowHeight = width > 0 ? (width - GAP * (columns - 1)) / columns : 160

  // 返回同一个对象（输入没变时），网格、工具栏可以跳过重新渲染
  return useMemo(
    () => ({
      width,
      gap: GAP,
      columns,
      minColumns: MIN_COLUMNS,
      maxColumns,
      setColumns: (n: number) => setPreferred(clamp(n)),
      // 在当前实际显示的列数上加减（保存的值可能超出当前窗口能放的范围）
      stepColumns: (delta: number) => setPreferred((p) => clamp(clamp(p) + delta)),
      rowHeight,
    }),
    [width, columns, maxColumns, setPreferred, clamp, rowHeight],
  )
}
