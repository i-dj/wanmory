import { ArrowDownUp, Check, ChevronDown, Funnel, LayoutGrid, type LucideIcon } from 'lucide-react'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import Popover, { MenuDivider, menuItemClass } from '@/components/ui/Popover'
import Tooltip from '@/components/ui/Tooltip'
import UserAvatar from '@/components/ui/UserAvatar'
import type { GridLayout } from '@/hooks/useGridLayout'
import { cx } from '@/lib/cx'
import { listUsers, type MediaKind, type User } from '@/lib/api'
import { MEDIA_KINDS } from '@/lib/views'

// 照片页左上角的几个下拉菜单（日历旁边）：排序、筛选、显示大小。按钮是图标加一个小箭头，
// 菜单里选中的那项前面打勾

// MenuAlign 是这些下拉菜单（和日历）往哪边展开：在工具栏左边时从按钮左边往右展开（start），
// 挪到右边时（「收藏」）从按钮右边往左展开（end），不伸出窗口
export const MenuAlign = createContext<'start' | 'end'>('start')

// SortBy、SortDir 是「排序」菜单的两组：按拍摄时间、添加时间（「收藏」里是收藏时间）排，升序（旧的在前）还是降序（新的在前）
export type SortBy = 'taken' | 'added' | 'favorited'
export type SortDir = 'desc' | 'asc'
export interface SortChoice {
  by: SortBy
  dir: SortDir
}
export const DEFAULT_SORT: SortChoice = { by: 'taken', dir: 'desc' }
const SORT_LABELS: Record<SortBy, string> = { taken: '拍摄日期', added: '添加日期', favorited: '收藏日期' }

// SortMenu：options 是第一组有哪几种（默认拍摄日期、添加日期；「收藏」里是收藏日期、拍摄日期）
export function SortMenu({
  value,
  onChange,
  options = ['taken', 'added'],
  defaultValue = DEFAULT_SORT,
}: {
  value: SortChoice
  onChange: (value: SortChoice) => void
  options?: SortBy[]
  defaultValue?: SortChoice // 这个分类默认怎么排；选的不是它时按钮亮一点
}) {
  return (
    <MenuButton icon={ArrowDownUp} label="排序" active={value.by !== defaultValue.by || value.dir !== defaultValue.dir}>
      {(close) => (
        <>
          {options.map((by) => (
            <Item key={by} checked={value.by === by} onClick={() => (onChange({ ...value, by }), close())}>
              {SORT_LABELS[by]}
            </Item>
          ))}
          <MenuDivider />
          <Item checked={value.dir === 'asc'} onClick={() => (onChange({ ...value, dir: 'asc' }), close())}>
            升序<span className="text-caption text-muted">从旧到新</span>
          </Item>
          <Item checked={value.dir === 'desc'} onClick={() => (onChange({ ...value, dir: 'desc' }), close())}>
            降序<span className="text-caption text-muted">从新到旧</span>
          </Item>
        </>
      )}
    </MenuButton>
  )
}

// FilterMenu：全部、照片、视频、动图。照片、视频、动图可以多选，点一下勾上、再点取消；
// 「全部」是都不筛（三种都勾上也算全部）。多选时菜单不收起，方便接着勾
// 下面一组是成员：和「全部」一样，先是「所有人」、一条分隔线，再是各个家庭成员（可以多选，前面是头像）；家里只有一个人时不显示这一组。
// 竖着一人一行：名字长短不一、人多了也放得下，和上面照片、视频那几行一样
export function FilterMenu({
  value,
  onChange,
  uploaders,
  onUploaders,
  membersOnly = false,
}: {
  value: MediaKind[]
  onChange: (value: MediaKind[]) => void
  uploaders: string[]
  onUploaders: (ids: string[]) => void
  membersOnly?: boolean // 只有「成员」一组，没有全部、照片、视频、动图（足迹用）；家里只有一个人时整个按钮都不显示
}) {
  const [members, setMembers] = useState<User[]>([])
  useEffect(() => {
    let alive = true
    void listUsers().then((list) => alive && setMembers(list))
    return () => {
      alive = false
    }
  }, [])
  const toggle = (kind: MediaKind) => {
    const next = value.includes(kind) ? value.filter((k) => k !== kind) : [...value, kind]
    onChange(next.length === MEDIA_KINDS.length ? [] : MEDIA_KINDS.map((k) => k.kind).filter((k) => next.includes(k)))
  }
  // 勾上、取消一个成员；都勾上了也算「所有人」
  const toggleMember = (id: string) => {
    const next = uploaders.includes(id) ? uploaders.filter((u) => u !== id) : [...uploaders, id]
    onUploaders(next.length === members.length ? [] : members.map((m) => m.id).filter((m) => next.includes(m)))
  }
  if (membersOnly && members.length <= 1) return null
  return (
    <MenuButton icon={Funnel} label="筛选" active={value.length > 0 || uploaders.length > 0}>
      {(close) => (
        <>
          {!membersOnly && (
            <>
              <Item
                checked={value.length === 0}
                onClick={() => {
                  onChange([])
                  close()
                }}
              >
                全部
              </Item>
              <MenuDivider />
              {MEDIA_KINDS.map(({ kind, label }) => (
                <Item key={kind} role="menuitemcheckbox" checked={value.includes(kind)} onClick={() => toggle(kind)}>
                  {label}
                </Item>
              ))}
            </>
          )}
          {members.length > 1 && (
            <>
              {!membersOnly && <MenuDivider />}
              <Item checked={uploaders.length === 0} onClick={() => (onUploaders([]), close())}>
                所有人
              </Item>
              <MenuDivider />
              {members.map((m) => (
                <Item
                  key={m.id}
                  role="menuitemcheckbox"
                  checked={uploaders.includes(m.id)}
                  onClick={() => toggleMember(m.id)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <UserAvatar user={m} className="size-5.5 text-micro" />
                    <span className="truncate">{m.name}</span>
                  </span>
                </Item>
              ))}
            </>
          )}
        </>
      )}
    </MenuButton>
  )
}

// SIZES 是「显示大小」的几档，对应大约每行几张；窗口窄放不下时 useGridLayout 会再少一些
const SIZES: { label: string; columns: number }[] = [
  { label: '小', columns: 8 },
  { label: '中等', columns: 5 },
  { label: '大', columns: 3 },
  { label: '超大', columns: 2 },
]

export function SizeMenu({ layout }: { layout: GridLayout }) {
  // 现在是哪一档：每行张数最接近的那档（以前用滑块调过的不一定正好是某一档）
  const current = SIZES.reduce((best, s) =>
    Math.abs(s.columns - layout.columns) < Math.abs(best.columns - layout.columns) ? s : best,
  )
  return (
    <MenuButton icon={LayoutGrid} label="显示大小">
      {(close) =>
        SIZES.map((s) => (
          <Item
            key={s.label}
            checked={s === current}
            disabled={s.columns > layout.maxColumns && s !== current} // 窗口太窄放不下这么多列
            onClick={() => {
              layout.setColumns(s.columns)
              close()
            }}
          >
            {s.label}
          </Item>
        ))
      }
    </MenuButton>
  )
}

// MenuButton 是图标加小箭头的按钮，点开下拉菜单。active 时（选的不是默认）图标底色亮一点，看得出筛过、排过
function MenuButton({
  icon: Icon,
  label,
  active,
  children,
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const align = useContext(MenuAlign)
  return (
    <Popover
      open={open}
      onClose={close}
      align={align}
      className="min-w-40 p-1"
      trigger={
        <Tooltip label={open ? null : label}>
          <button
            type="button"
            aria-label={label}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={cx(
              'flex h-8 items-center gap-1 rounded-control px-1.5 text-fg/85 transition-colors hover:bg-fg/[0.07] hover:text-fg',
              (open || active) && 'bg-fg/[0.08] text-fg',
            )}
          >
            <Icon className="size-4.75" strokeWidth={1.7} />
            <ChevronDown className="size-3.5 text-muted" strokeWidth={2} />
          </button>
        </Tooltip>
      }
    >
      <div role="none">{children(close)}</div>
    </Popover>
  )
}

// Item 是菜单里的一项：前面留一格放勾，选中的打勾
function Item({
  checked,
  disabled,
  role = 'menuitemradio',
  onClick,
  children,
}: {
  checked: boolean
  role?: 'menuitemradio' | 'menuitemcheckbox' // 单选的一组还是可以多选的
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={cx(menuItemClass, 'text-fg')}
    >
      <Check className={cx('size-4 shrink-0 text-accent', !checked && 'invisible')} strokeWidth={2.4} />
      <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">{children}</span>
    </button>
  )
}
