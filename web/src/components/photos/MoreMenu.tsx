import { Download, Info, Maximize2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MenuItem } from '@/components/ui/Popover'
import { useAnchorPosition } from '@/hooks/useAnchorPosition'
import { type Asset, downloadAssets } from '@/lib/api'

// MoreMenu 是照片右上角「更多」的菜单，样子和页面上其他菜单一样。
// 放到 body 下、浮在按钮下面，不会被照片格子裁掉，也不会压在照片里显得挤；右边和按钮对齐。
// 点按钮和菜单以外的地方、滚动、按 Esc 都收起。
export default function MoreMenu({
  asset,
  anchor,
  onOpen,
  onInfo,
  onClose,
}: {
  asset: Asset
  anchor: React.RefObject<HTMLElement | null>
  onOpen: () => void
  onInfo: () => void
  onClose: () => void
}) {
  const menu = useRef<HTMLDivElement>(null)
  const position = useAnchorPosition(anchor, true, { minWidth: 160, align: 'end' })

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!anchor.current?.contains(t) && !menu.current?.contains(t)) onClose()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onClose, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onClose)
    }
  }, [anchor, onClose])

  const pick = (fn: () => void) => () => {
    onClose()
    fn()
  }
  if (!position) return null
  return createPortal(
    <div ref={menu} role="menu" style={position} className="popover-card glass-menu fixed z-40 rounded-panel p-1">
      <MenuItem icon={Maximize2} label="查看大图" onClick={pick(onOpen)} />
      <MenuItem icon={Info} label="照片信息" onClick={pick(onInfo)} />
      <MenuItem icon={Download} label="下载原图" onClick={pick(() => downloadAssets([asset.id]))} />
    </div>,
    document.body,
  )
}
