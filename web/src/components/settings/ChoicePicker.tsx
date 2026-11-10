import { useState } from 'react'
import type { Choice } from '@/lib/api'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { DialogActions } from '@/components/ui/Modal'
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
    <Modal title={title} onClose={onCancel}>
      {error && <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-body text-danger">{error}</p>}
      <div className="flex flex-col gap-2">
        {choices.map((c) => (
          <label
            key={c.value}
            className={cx(
              'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5',
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
      <DialogActions>
        <DialogButton onClick={onCancel}>取消</DialogButton>
        <DialogButton variant="primary" onClick={confirm} disabled={busy}>
          确认
        </DialogButton>
      </DialogActions>
    </Modal>
  )
}
