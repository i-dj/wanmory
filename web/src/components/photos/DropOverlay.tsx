import { t } from '@/i18n'
// DropOverlay 是把文件拖进窗口时盖满整个窗口的提示。
export default function DropOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-accent/15 p-6">
      <div className="flex size-full items-center justify-center rounded-dialog border-2 border-dashed border-accent bg-page/80 text-center">
        <div>
          <p className="text-lg font-semibold">{t('松开即可上传')}</p>
          <p className="mt-1 text-body text-muted">
            {t('支持 JPG、PNG、HEIC、WebP、MP4、MOV 等，内容相同的文件不会重复保存')}
          </p>
        </div>
      </div>
    </div>
  )
}
