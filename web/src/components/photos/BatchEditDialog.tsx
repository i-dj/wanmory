import { type Asset, type AssetPatch, type InfoPatch, updateAssets } from '@/lib/api'
import { useMapsEnabled } from '@/lib/geo'
import { AdjustDateDialog, EditLocationDialog } from './InfoEditDialogs'

// BatchEditDialog 是选中好几张后「更多」菜单里的「调整日期和时间」「修改位置」（像 macOS「照片」）：
//   - 时间：对话框里调的是最早那张的时间，换算成要挪多少秒，所有照片一起挪（间隔不变），时区也都改成它；
//   - 位置：都改到同一个位置；地图上先放在有位置的那张那里。
// 保存出错时错误留在对话框里（onSaved 才更新列表），可以改了再存
export default function BatchEditDialog({
  kind,
  assets,
  onSaved,
  onClose,
}: {
  kind: 'date' | 'location'
  assets: Asset[] // 选中的照片
  onSaved: (changed: Asset[]) => void
  onClose: () => void
}) {
  const mapsOn = useMapsEnabled() === true
  const earliest = assets.reduce<Asset | undefined>(
    (a, b) => (!a || Date.parse(b.sort_time) < Date.parse(a.sort_time) ? b : a),
    undefined,
  )
  if (!earliest) return null

  const save = async (patch: AssetPatch) =>
    onSaved(
      await updateAssets(
        assets.map((a) => a.id),
        patch,
      ),
    )

  if (kind === 'date') {
    const saveDate = async (patch: InfoPatch) => {
      if (patch.reset) return save({ reset: patch.reset })
      if (!patch.taken_at) return
      const before = Date.parse(earliest.taken_at ?? earliest.sort_time)
      const after = Date.parse(patch.taken_at.local + patch.taken_at.offset)
      await save({ taken_at_shift: Math.round((after - before) / 1000), taken_at_offset: patch.taken_at.offset })
    }
    return (
      <AdjustDateDialog
        asset={earliest}
        original={null}
        count={assets.length}
        edited={assets.some((a) => a.edited.includes('taken_at'))}
        onSave={saveDate}
        onClose={onClose}
      />
    )
  }

  const shown = assets.find((a) => a.latitude != null) // 有位置的那张优先显示
  return (
    <EditLocationDialog
      asset={shown ?? earliest}
      // 原来都在这个位置（或者都没有位置）时，位置没动就不用保存
      uniform={assets.every(
        (a) => a.latitude === (shown?.latitude ?? null) && a.longitude === (shown?.longitude ?? null),
      )}
      mapsOn={mapsOn}
      count={assets.length}
      edited={assets.some((a) => a.edited.includes('location'))}
      onSave={(patch) => save(patch.reset ? { reset: patch.reset } : { location: patch.location ?? null })}
      onClose={onClose}
    />
  )
}
