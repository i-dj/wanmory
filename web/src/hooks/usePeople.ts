import { useCallback, useEffect, useState } from 'react'
import { listPeople, type Person } from '@/lib/api'

// usePeople 是人脸识别归出来的人物列表（人物页、人物的照片页用）。还没加载出来时是 null。
// refresh 在改了名字、或者识别有进展时调用
export function usePeople() {
  const [people, setPeople] = useState<Person[] | null>(null)
  const refresh = useCallback(async () => {
    try {
      setPeople(await listPeople())
    } catch (e) {
      console.error('读取人物失败', e)
      setPeople((prev) => prev ?? [])
    }
  }, [])
  useEffect(() => {
    void refresh()
  }, [refresh])
  return { people, refresh }
}
