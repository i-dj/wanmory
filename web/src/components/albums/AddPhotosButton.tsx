import { ImagePlus, Library, type LucideIcon, MonitorUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Popover from '@/components/ui/Popover'
import { openFilePicker, UPLOAD_ACCEPT } from '@/components/photos/UploadButton'

// AddPhotosButton 是相册里工具栏右边的「添加照片」：弹出两个选择，从图库挑已有的照片，或者从电脑上传新的。
// 刚建好相册时自动弹出（autoOpen），直接接着加照片。
export default function AddPhotosButton({
  autoOpen,
  onAutoOpened,
  onPickFromLibrary,
  onFiles,
}: {
  autoOpen: boolean
  onAutoOpened: () => void
  onPickFromLibrary: () => void
  onFiles: (files: FileList) => void
}) {
  const [open, setOpen] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!autoOpen) return
    setOpen(true)
    onAutoOpened()
  }, [autoOpen, onAutoOpened])

  return (
    <>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        align="end"
        className="w-72 p-2"
        trigger={
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line bg-fg/[0.04] px-3.5 text-body font-medium whitespace-nowrap text-fg transition-colors hover:bg-fg/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ImagePlus className="size-4" strokeWidth={2} />
            添加照片
          </button>
        }
      >
        <p className="px-2.5 pt-1 pb-2 text-caption font-semibold text-muted">添加照片到这个相册</p>
        <Choice
          icon={Library}
          title="从图库添加"
          detail="挑选已经上传过的照片"
          onClick={() => {
            setOpen(false)
            onPickFromLibrary()
          }}
        />
        <Choice
          icon={MonitorUp}
          title="从电脑添加"
          detail="上传新的照片和视频，传完自动放进相册"
          onClick={() => {
            setOpen(false)
            openFilePicker(input.current)
          }}
        />
      </Popover>
      <input
        ref={input}
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </>
  )
}

function Choice({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: LucideIcon
  title: string
  detail: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-control p-2.5 text-left transition hover:bg-accent-soft active:scale-[0.98]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-on-accent">
        <Icon className="size-5" strokeWidth={1.7} />
      </span>
      <span className="min-w-0">
        <span className="block text-body font-medium">{title}</span>
        <span className="block text-caption text-muted">{detail}</span>
      </span>
    </button>
  )
}
