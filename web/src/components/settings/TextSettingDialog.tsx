import { type FormEvent, useState } from 'react'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { DialogActions, DialogError, dialogInputClass } from '@/components/ui/Modal'

// TextSettingDialog 改一行文字的设置（例如访问域名）：一个输入框，格式不对时服务器的错误写在按钮上面
export default function TextSettingDialog({
  title,
  value,
  placeholder,
  onCancel,
  onConfirm,
}: {
  title: string
  value: string
  placeholder?: string
  onCancel: () => void
  onConfirm: (value: string) => Promise<void>
}) {
  const [text, setText] = useState(value)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onConfirm(text.trim())
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }
  return (
    <Modal title={title} onClose={onCancel}>
      <form onSubmit={submit} noValidate className="space-y-3">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError('')
          }}
          placeholder={placeholder}
          autoFocus
          spellCheck={false}
          autoCapitalize="off"
          className={dialogInputClass}
        />
        <DialogError>{error}</DialogError>
        <DialogActions className="mt-3">
          <DialogButton onClick={onCancel}>取消</DialogButton>
          <DialogButton variant="primary" type="submit" disabled={busy || !text.trim()}>
            保存
          </DialogButton>
        </DialogActions>
      </form>
    </Modal>
  )
}
