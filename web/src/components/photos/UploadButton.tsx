import { FolderUp, Upload } from 'lucide-react'
import { type RefObject, useEffect, useRef } from 'react'
import Tooltip from '@/components/ui/Tooltip'
import { t } from '@/i18n'

// 选文件窗口里能选的：和服务器支持的扩展名一致（server/internal/assets/ingest.go 的 supportedExts）。
// 只写扩展名、不写 image/* 这种通配：macOS 打开选文件窗口前要把通配展开成几百种文件类型，点了要卡一下才弹出来
export const UPLOAD_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.tif,.tiff,.dng,.mp4,.m4v,.mov,.3gp,.mkv,.avi'

const EXTS = new Set(UPLOAD_ACCEPT.split(',').map((x) => x.trim().toLowerCase()))

// isMedia：是能传的照片、视频（按扩展名，和选文件窗口里能选的一样）；隐藏文件（.DS_Store、._xxx）不算。
// 选文件夹、拖文件夹进来时用它挑出要传的
export function isMedia(f: File) {
  if (f.name.startsWith('.')) return false
  const dot = f.name.lastIndexOf('.')
  return dot > 0 && EXTS.has(f.name.slice(dot).toLowerCase())
}

// FolderInput 是选文件夹用的隐藏输入框：选一个文件夹，里面一层层所有的文件都会拿到，只留照片和视频交给 onFiles
export function FolderInput({ ref, onFiles }: { ref: RefObject<HTMLInputElement | null>; onFiles: (files: File[]) => void }) {
  // webkitdirectory 不是 React 认识的属性，挂上以后再设
  useEffect(() => {
    ref.current?.setAttribute('webkitdirectory', '')
  }, [ref])
  return (
    <input
      ref={ref}
      type="file"
      hidden
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []).filter(isMedia)
        if (files.length) onFiles(files)
        e.target.value = ''
      }}
    />
  )
}

// openFilePicker 打开选文件的窗口。不在点击的当下打开：选文件窗口一弹出来，网页就停住不画了，按钮按下去的样子
// 会一直留着，等窗口出来才弹回去，看着卡。先让浏览器把按钮弹回来的那一帧画出来（等两帧），再打开窗口
export function openFilePicker(input: HTMLInputElement | null) {
  requestAnimationFrame(() => requestAnimationFrame(() => input?.click()))
}

// UploadButton 是工具栏上的「上传」按钮，点了打开选择文件的窗口；旁边的文件夹图标选整个文件夹（里面的子文件夹也算）
export default function UploadButton({ onFiles }: { onFiles: (files: FileList | File[]) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const folder = useRef<HTMLInputElement>(null)
  return (
    <>
      <Tooltip label={t('上传文件夹')}>
        <button
          type="button"
          aria-label={t('上传文件夹')}
          onClick={() => openFilePicker(folder.current)}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-fg/[0.04] text-fg transition-colors hover:bg-fg/[0.08]"
        >
          <FolderUp className="size-4" strokeWidth={2} />
        </button>
      </Tooltip>
      <FolderInput ref={folder} onFiles={onFiles} />
      <button
        type="button"
        onClick={() => openFilePicker(input.current)}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line bg-fg/[0.04] px-3.5 text-body font-medium whitespace-nowrap text-fg transition-colors hover:bg-fg/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Upload className="size-4" strokeWidth={2} />
        {t('上传')}
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files)
          e.target.value = '' // 同一批文件再选一次也能触发
        }}
      />
    </>
  )
}
