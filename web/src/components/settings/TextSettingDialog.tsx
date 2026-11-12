import { type FormEvent, useState } from 'react'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { DialogFooter, DialogError, dialogInputClass } from '@/components/ui/Modal'
import { t } from '@/i18n'

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
        <DialogFooter>
          <DialogButton onClick={onCancel}>{t('取消')}</DialogButton>
          <DialogButton variant="primary" type="submit" disabled={busy || !text.trim()}>
            {t('保存')}
          </DialogButton>
        </DialogFooter>
      </form>
    </Modal>
  )
}
