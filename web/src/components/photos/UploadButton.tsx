import { Upload } from 'lucide-react'
import { useRef } from 'react'

// 选文件窗口里能选的：和服务器支持的扩展名一致（server/internal/assets/ingest.go 的 supportedExts）。
// 只写扩展名、不写 image/* 这种通配：macOS 打开选文件窗口前要把通配展开成几百种文件类型，点了要卡一下才弹出来
export const UPLOAD_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.tif,.tiff,.dng,.mp4,.m4v,.mov,.3gp,.mkv,.avi'

// openFilePicker 打开选文件的窗口。不在点击的当下打开：选文件窗口一弹出来，网页就停住不画了，按钮按下去的样子
// 会一直留着，等窗口出来才弹回去，看着卡。先让浏览器把按钮弹回来的那一帧画出来（等两帧），再打开窗口
export function openFilePicker(input: HTMLInputElement | null) {
  requestAnimationFrame(() => requestAnimationFrame(() => input?.click()))
}

// UploadButton 是工具栏上的「上传」按钮，点了打开选择文件的窗口。
export default function UploadButton({ onFiles }: { onFiles: (files: FileList) => void }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <button
        type="button"
        onClick={() => openFilePicker(input.current)}
        className="flex items-center gap-1.5 rounded-control border border-line bg-fg/[0.04] px-3 py-1.5 text-body font-medium text-fg hover:bg-fg/[0.08]"
      >
        <Upload className="size-4" strokeWidth={2} />
        上传
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
