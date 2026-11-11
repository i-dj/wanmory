import Segmented from '@/components/ui/Segmented'
import { PERSON_TABS, personPath, type PersonTab } from '@/lib/views'

// PersonTabs 是人物页头部右边那一组标签：照片、成长、足迹、合影。和全站其他切换一样用分段按钮（没有底和边框，
// 选中的那段一块淡淡的圆角底）。每个标签是链接（可以在新标签页打开）
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
    <Segmented
      label="人物"
      value={tab}
      onChange={(t) => navigate(personPath(personId, t))}
      segments={PERSON_TABS.map((t) => ({ value: t.tab, label: t.label, href: personPath(personId, t.tab) }))}
    />
  )
}
