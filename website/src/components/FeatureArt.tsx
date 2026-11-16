import { Check, Download, FolderOpen, FolderUp, HardDrive, RefreshCw, Usb } from 'lucide-react'
import type { ReactNode } from 'react'
import { usePage } from '../i18n'
import type { HomeDict } from '../i18n/locales/zh/home'
import Photo from './Photo'

// FeatureArt 是首页第二排特性卡顶上的插图：用真照片和缩小的界面零件拼出这个功能「长什么样」，
// 一眼看懂是干什么的。kind 和卡片的顺序一一对应：上传、续传、导入、下载
export type ArtKind = 'upload' | 'resume' | 'import' | 'download'

export default function FeatureArt({ kind }: { kind: ArtKind }) {
  return (
    <div className="relative h-44 overflow-hidden border-b border-line bg-[radial-gradient(120%_90%_at_50%_0%,rgb(246_167_124/0.14),transparent_70%)]">
      {kind === 'upload' && <UploadArt />}
      {kind === 'resume' && <ResumeArt />}
      {kind === 'import' && <ImportArt />}
      {kind === 'download' && <DownloadArt />}
    </div>
  )
}

const useArt = () => usePage<HomeDict>().more.art

// 一个打开的文件夹，几张照片从里面散开飞出来，下面是虚线的拖放区和「松开上传」
function UploadArt() {
  const t = useArt()
  const fan = [
    { id: 17, cls: '-rotate-[14deg] -translate-x-16 translate-y-1' },
    { id: 231, cls: '-rotate-[4deg] -translate-x-5 -translate-y-3' },
    { id: 412, cls: 'rotate-[8deg] translate-x-7 -translate-y-1' },
    { id: 66, cls: 'rotate-[18deg] translate-x-[4.5rem] translate-y-3' },
  ]
  return (
    <div className="absolute inset-3 grid place-items-center rounded-xl border border-dashed border-accent/40 bg-accent/[0.03]">
      <div className="relative -mt-6 h-20 w-24">
        {fan.map(({ id, cls }) => (
          <Photo
            key={id}
            id={id}
            square
            className={`absolute top-0 left-1/2 -ml-7 size-14 rounded-lg border-2 border-white/90 shadow-lg ${cls}`}
          />
        ))}
        <div className="absolute inset-x-1 bottom-0 grid h-11 place-items-center rounded-lg bg-[#3a2a20] text-accent shadow-[0_-6px_16px_rgb(0_0_0/0.35)]">
          <FolderOpen className="size-5" strokeWidth={1.8} />
        </div>
      </div>
      <div className="absolute bottom-3 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-black shadow-lg">
        <FolderUp className="size-3.5" strokeWidth={2.2} />
        {t.drop}
      </div>
    </div>
  )
}

// 上传列表：一个大视频断了接着传（进度条走到一半），一张已有的跳过，一张传完
function ResumeArt() {
  const t = useArt()
  return (
    <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 space-y-2">
      <Row id={484} name="IMG_2041.MOV" size="2.4 GB">
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[62%] rounded-full bg-accent" />
          </div>
          <span className="flex items-center gap-1 text-[10px] text-accent">
            <RefreshCw className="size-2.5" strokeWidth={2.5} />
            {t.resume}
          </span>
        </div>
      </Row>
      <Row id={206} name="IMG_1830.HEIC" size="3.1 MB" dim>
        <div className="mt-1 text-[10px] text-faint">{t.skipped}</div>
      </Row>
      <Row id={381} name="IMG_1907.JPG" size="4.6 MB" done />
    </div>
  )
}

function Row({
  id,
  name,
  size,
  dim,
  done,
  children,
}: {
  id: number
  name: string
  size: string
  dim?: boolean
  done?: boolean
  children?: ReactNode
}) {
  return (
    <div className={`flex items-center gap-2.5 rounded-lg bg-white/[0.05] px-2.5 py-2 ${dim ? 'opacity-55' : ''}`}>
      <Photo id={id} square className="size-8 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="truncate font-medium text-soft">{name}</span>
          <span className="shrink-0 text-faint tabular-nums">{size}</span>
        </div>
        {children}
      </div>
      {done && <Check className="size-3.5 shrink-0 text-ok" strokeWidth={2.5} />}
    </div>
  )
}

// 挂进来的照片文件夹：NAS、移动硬盘两棵小目录树，标着「只读」，右边一排照片被找出来，底下「每 15 分钟扫描」
function ImportArt() {
  const t = useArt()
  const dirs = [
    { icon: HardDrive, path: '/photos/nas', count: '12,480' },
    { icon: Usb, path: '/photos/usb', count: '3,216' },
  ]
  return (
    <div className="absolute inset-x-5 top-1/2 -translate-y-1/2">
      <div className="space-y-2">
        {dirs.map(({ icon: Icon, path, count }) => (
          <div key={path} className="flex items-center gap-2.5 rounded-lg bg-white/[0.05] px-3 py-2.5">
            <Icon className="size-4 shrink-0 text-accent" strokeWidth={1.9} />
            <span className="font-mono text-[11px] text-soft">{path}</span>
            <span className="rounded bg-white/[0.08] px-1.5 py-px text-[9.5px] font-medium text-muted">{t.readOnly}</span>
            <span className="ml-auto text-[10.5px] text-faint tabular-nums">{count}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {[28, 162, 247, 424].map((id) => (
          <Photo key={id} id={id} square className="size-9 rounded-md" />
        ))}
        <span className="ml-auto flex items-center gap-1 text-[10px] whitespace-nowrap text-ok">
          <RefreshCw className="size-2.5" strokeWidth={2.5} />
          {t.scan}
        </span>
      </div>
    </div>
  )
}

// 照片网格里勾选了几张（右上角橙色的勾），下面一个「下载」按钮：一次打包下载
function DownloadArt() {
  const t = useArt()
  const grid = [
    { id: 29, on: true },
    { id: 218, on: false },
    { id: 483, on: true },
    { id: 77, on: true },
    { id: 412, on: false },
    { id: 17, on: false },
    { id: 162, on: true },
    { id: 247, on: false },
    { id: 424, on: true },
    { id: 471, on: false },
  ]
  return (
    <div className="absolute inset-x-5 top-1/2 -translate-y-1/2">
      <div className="grid grid-cols-5 gap-1.5">
        {grid.map(({ id, on }) => (
          <div key={id} className="relative">
            <Photo
              id={id}
              square
              className={`aspect-square w-full rounded-md transition ${on ? 'ring-2 ring-accent ring-offset-2 ring-offset-card' : 'opacity-50'}`}
            />
            {on && (
              <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-accent text-black shadow">
                <Check className="size-2.5" strokeWidth={3.5} />
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <span className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-black shadow-lg">
          <Download className="size-3.5" strokeWidth={2.2} />
          {t.download}
        </span>
      </div>
    </div>
  )
}
