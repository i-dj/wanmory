import Segmented from '@/components/ui/Segmented'
import { PERSON_TABS, personPath, type PersonTab } from '@/lib/views'

// PersonTabs 是人物页标题旁边的分段按钮：照片、成长、足迹、合影（每段是链接，可以在新标签页打开）
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
      segments={PERSON_TABS.map((t) => ({ value: t.tab, label: t.label, href: personPath(personId, t.tab) }))}
      value={tab}
      onChange={(t) => navigate(personPath(personId, t))}
    />
  )
}
