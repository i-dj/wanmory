import { useState } from 'react'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { DialogActions } from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import { faceThumbUrl, type Person, setBirthday } from '@/lib/api'
import { ageAt } from '@/lib/age'
import { personName } from '@/lib/views'
import { fmtDayOfMonth, fmtMonthName, t } from '@/i18n'

const pad = (n: number) => String(n).padStart(2, '0')
const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate()

// BirthdayDialog 设置、修改生日：上面是头像，中间年、月、日三个下拉，下面实时显示现在多大。
// 没设置过时先选在 suggest（这个人最早的照片那天，宝宝多半是出生前后）
export default function BirthdayDialog({
  person,
  suggest,
  onClose,
  onSaved,
}: {
  person: Person
  suggest: Date | null
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const today = new Date()
  const start = person.birthday ? person.birthday.split('-').map(Number) : null
  const guess = suggest && suggest <= today ? suggest : today
  const [year, setYear] = useState(start ? start[0] : guess.getFullYear())
  const [month, setMonth] = useState(start ? start[1] : guess.getMonth() + 1)
  const [day, setDay] = useState(start ? start[2] : guess.getDate())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const d = Math.min(day, daysIn(year, month)) // 换了月份，31 号可能不存在
  const value = `${year}-${pad(month)}-${pad(d)}`
  const future = new Date(year, month - 1, d) > today
  const age = future ? '' : ageAt(value, today)

  const save = async (birthday: string) => {
    setBusy(true)
    setError(null)
    try {
      await setBirthday(person.id, birthday)
      await onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  const years = Array.from({ length: 100 }, (_, i) => today.getFullYear() - i)
  return (
    <Modal title={person.birthday ? t('修改生日') : t('设置生日')} subtitle={personName(person)} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <span className="size-20 overflow-hidden rounded-full bg-line shadow-md">
          {person.cover && <img src={faceThumbUrl(person.cover)} alt="" className="size-full object-cover" />}
        </span>
        <p className="mt-3 text-caption text-muted">
          {t('设置后，「成长」按年龄分段：两岁前每个月，之后每半年、每年')}
        </p>

        <div className="mt-5 flex items-center gap-2">
          <Select
            label={t('年')}
            value={String(year)}
            onChange={(v) => setYear(Number(v))}
            options={years.map((y) => [String(y), t('{y}年', { y })])}
            className="w-28"
          />
          <Select
            label={t('月')}
            value={String(month)}
            onChange={(v) => setMonth(Number(v))}
            options={Array.from({ length: 12 }, (_, i) => [String(i + 1), fmtMonthName(new Date(2000, i, 1))])}
            className="w-22"
          />
          <Select
            label={t('日')}
            value={String(d)}
            onChange={(v) => setDay(Number(v))}
            options={Array.from({ length: daysIn(year, month) }, (_, i) => [
              String(i + 1),
              fmtDayOfMonth(new Date(2000, 0, i + 1)),
            ])}
            className="w-22"
          />
        </div>
        <p className="mt-4 h-5 text-body tabular-nums">
          {future ? (
            <span className="text-danger">{t('生日不能晚于今天')}</span>
          ) : (
            age && (
              <>
                {t('现在')} <span className="font-semibold text-accent">{age}</span>
              </>
            )
          )}
        </p>
        {error && (
          <p className="mt-2 text-caption text-danger">
            {t('没有保存成功：')}
            {error}
          </p>
        )}
      </div>
      <DialogActions>
        {person.birthday ? (
          <DialogButton variant="danger" disabled={busy} onClick={() => void save('')}>
            {t('去掉生日')}
          </DialogButton>
        ) : (
          <DialogButton onClick={onClose}>{t('取消')}</DialogButton>
        )}
        <DialogButton variant="primary" disabled={busy || future} onClick={() => void save(value)}>
          {busy ? t('保存中…') : t('保存')}
        </DialogButton>
      </DialogActions>
    </Modal>
  )
}
