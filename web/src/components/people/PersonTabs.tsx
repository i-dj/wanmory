import { cx } from '@/lib/cx'
import { PERSON_TABS, personPath, type PersonTab } from '@/lib/views'

// PersonTabs 是人物页头像下面那一排标签：照片、成长、足迹、合影。选中的橙色字、下面一道橙色粗线，
// 整排下面一条细线。每个标签是链接（可以在新标签页打开）
export default function PersonTabs({
  personId,
  tab,
  navigate,
}: {
  personId: string
  tab: PersonTab
  navigate: (to: string) => void
}) {
  return (
    <nav aria-label="人物" className="mt-7 flex gap-1.5 border-b border-line">
      {PERSON_TABS.map((t) => {
        const href = personPath(personId, t.tab)
        const active = t.tab === tab
        return (
          <a
            key={t.tab}
            href={href}
            aria-current={active ? 'page' : undefined}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey) return
              e.preventDefault()
              navigate(href)
            }}
            className={cx(
              'relative -mb-px px-3 pb-3 text-[15px] transition-colors',
              active
                ? 'font-medium text-accent after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent'
                : 'text-muted hover:text-fg',
            )}
          >
            {t.label}
          </a>
        )
      })}
    </nav>
  )
}
