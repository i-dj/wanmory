import { useState } from 'react'
import type { Choice } from '@/lib/api'
import Modal, { Button } from '@/components/ui/Modal'
import { cx } from '@/lib/cx'

// ChoicePicker 从几个选项里选一个。
export default function ChoicePicker({
  title,
  choices,
  value,
  onCancel,
  onConfirm,
}: {
  title: string
  choices: Choice[]
  value: string
  onCancel: () => void
  onConfirm: (value: string) => Promise<void>
}) {
  const [selected, setSelected] = useState(value)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const confirm = async () => {
    setBusy(true)
    setError('')
    try {
      await onConfirm(selected)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel}>取消</Button>
          <Button primary onClick={confirm} disabled={busy}>
            确认
          </Button>
        </div>
      }
    >
      {error && <p className="mx-4 mt-3 rounded-control bg-danger/10 px-3 py-2 text-body text-danger">{error}</p>}
      <div className="flex flex-col gap-2 p-4">
        {choices.map((c) => (
          <label
            key={c.value}
            className={cx(
              'flex cursor-pointer items-start gap-3 rounded-control border px-3 py-2',
              selected === c.value ? 'border-accent bg-accent-soft' : 'border-line hover:bg-accent-soft',
            )}
          >
            <input
              type="radio"
              name="choice"
              value={c.value}
              checked={selected === c.value}
              onChange={() => setSelected(c.value)}
              className="mt-1 accent-accent"
            />
            <span>
              <span className="block text-body font-medium">{c.label}</span>
              {c.hint && <span className="block text-body text-muted">{c.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </Modal>
  )
}
