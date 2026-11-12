import DialogButton from '@/components/ui/DialogButton'
import { Check, Folder, Pencil, Plus, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { type Album, isSynced, previewSmart, type Sharing, type SmartOptions, type SmartRules } from '@/lib/api'
import { cx } from '@/lib/cx'
import { browserTimeZone, complete, defaultRule } from '@/lib/smartRules'
import TextField from '@/components/ui/TextField'
import Checkbox from '@/components/ui/Checkbox'
import SharingPicker from './SharingPicker'
import SmartRulesEditor from './SmartRulesEditor'
import { t } from '@/i18n'

// AlbumDialog 是新建、编辑相册的对话框：窗口正中一张卡片，背后变暗。
// 新建时先选「普通相册」还是「智能相册」。智能相册要填条件（见 SmartRulesEditor），
// 下面实时显示有多少项符合；勾上「自动同步」，以后新增的照片只要符合条件就自动出现在相册里。
// 名字（智能相册还有条件）下面是权限设置：所有人、指定成员还是仅自己（见 SharingPicker），默认共享给所有人，私有时可以同时隐藏我传的照片；
// 建好后在相册的「权限设置」里改。智能相册的「自动同步」在权限设置下面。
// 回车确定，Esc 或点外面取消；保存失败时把错误写在下面，不关闭。
export default function AlbumDialog({
  album,
  count,
  allowSmart,
  albums,
  onSubmit,
  onClose,
}: {
  album?: Album // 编辑这个相册；没有就是新建
  count?: number // 新建时一起放进去的照片数（从选中的照片新建）
  allowSmart: boolean // 新建时能不能选智能相册（从选中的照片新建时不能）
  albums: Album[] // 条件「相册 是 …」可以选的
  onSubmit: (name: string, smart?: SmartOptions, sharing?: Sharing & { hide_mine?: boolean }) => Promise<void>
  onClose: () => void
}) {
  const editing = !!album
  const [kind, setKind] = useState<'normal' | 'smart'>(album?.kind ?? 'normal')
  const [name, setName] = useState(album?.name ?? t('新相册'))
  const [rules, setRules] = useState<SmartRules>(
    album?.rules ?? { match: 'all', rules: [defaultRule('photo')], tz: browserTimeZone() },
  )
  const [autoSync, setAutoSync] = useState(album?.auto_sync ?? true)
  const [sharing, setSharing] = useState<Sharing>({ private: false, members: [] })
  const [hideMine, setHideMine] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const smart = kind === 'smart'
  const matched = useMatchCount(smart ? rules : null)

  useEffect(() => {
    input.current?.select() // 默认名字全选，直接打字就替换
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // 新建时换类型，默认名字跟着换（用户改过名字就不动）
  const switchKind = (k: 'normal' | 'smart') => {
    setKind(k)
    if (name === t('新相册') || name === t('新智能相册')) setName(k === 'smart' ? t('新智能相册') : t('新相册'))
  }

  const ready = name.trim() !== '' && (!smart || rules.rules.every(complete))
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready || saving) return
    setSaving(true)
    setError('')
    try {
      await onSubmit(
        name.trim(),
        smart ? { rules: { ...rules, tz: browserTimeZone() }, auto_sync: autoSync } : undefined,
        editing ? undefined : { ...sharing, hide_mine: sharing.private && hideMine },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  const choosable = albums.filter((a) => a.id !== album?.id && !isSynced(a))
  const Icon = smart ? Sparkles : editing ? Pencil : Folder
  return createPortal(
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="album-dialog-title"
        onSubmit={submit}
        className={cx(
          'dialog-card glass-dialog max-h-[90vh] w-full overflow-y-auto rounded-dialog p-6 transition-[max-width] duration-200',
          smart ? 'max-w-180' : 'max-w-105',
        )}
      >
        {/* 和其他弹出窗口（Modal）一样的头：上面居中的圆形图标，下面居中的标题和一行说明；没有「×」 */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Icon className="size-5.5" strokeWidth={2} />
          </div>
          <h2 id="album-dialog-title" className="text-heading font-semibold">
            {editing ? (smart ? t('编辑智能相册') : t('重命名相册')) : t('新建相册')}
          </h2>
          <p className="mt-1.5 text-body text-muted">
            {editing
              ? smart
                ? t('修改名字和条件')
                : t('给相册换个名字')
              : count
                ? t('放进选中的 {count} 项', { count })
                : smart
                  ? t('按条件自动收集照片')
                  : t('建好后可以从图库或电脑添加照片')}
          </p>
        </div>

        {!editing && allowSmart && (
          <div
            role="radiogroup"
            aria-label={t('相册类型')}
            className="mt-5 grid grid-cols-2 gap-1 rounded-panel bg-line/50 p-1"
          >
            {(
              [
                ['normal', t('普通相册'), Folder],
                ['smart', t('智能相册'), Sparkles],
              ] as const
            ).map(([k, label, KIcon]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => switchKind(k)}
                className={cx(
                  'flex items-center justify-center gap-1.5 rounded-control py-1.5 text-body font-medium transition',
                  kind === k ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg',
                )}
              >
                <KIcon className="size-3.5" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        )}

        <TextField
          label={t('相册名')}
          inputRef={input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="mt-6"
        />

        {smart && (
          <div className="mt-5">
            <SmartRulesEditor value={rules} onChange={setRules} albums={choosable} />
          </div>
        )}

        {!editing && (
          <div className="mt-5">
            <p className="mb-2 text-caption font-medium text-muted">{t('权限设置')}</p>
            <SharingPicker
              value={sharing}
              onChange={setSharing}
              privateExtra={
                <Checkbox checked={hideMine} onChange={setHideMine} title={t('同时设置照片/视频的自动隐藏')}>
                  {t('仅自己可见，后续新增的照片和视频也将自动隐藏。')}
                </Checkbox>
              }
            />
          </div>
        )}

        {/* 自动同步放在权限设置下面，紧挨着按钮 */}
        {smart && (
          <>
            <label className="mt-5 flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cx(
                  'mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-[5px] border transition peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40',
                  autoSync ? 'border-accent bg-accent text-on-accent' : 'border-line bg-page',
                )}
              >
                {autoSync && <Check className="size-3" strokeWidth={3.2} />}
              </span>
              <span>
                <span className="block text-body font-medium">{t('自动同步')}</span>
                <span className="block text-caption text-muted">
                  {autoSync
                    ? t('以后新增的照片，只要符合条件就自动加入')
                    : t('只放入现在符合条件的照片，之后可以手动增减')}
                </span>
              </span>
            </label>
          </>
        )}

        {error && <p className="mt-3 text-caption text-danger">{error}</p>}

        <div className="mt-6 flex items-center gap-3">
          {smart && (
            <span className="text-body text-muted tabular-nums">
              {matched === undefined
                ? t('条件还没填完整')
                : matched === null
                  ? t('正在统计…')
                  : t('{matched} 项符合', { matched })}
            </span>
          )}
          <div className={cx('ml-auto grid gap-2.5', smart ? 'w-60' : 'w-full', 'grid-cols-2')}>
            <DialogButton onClick={onClose}>{t('取消')}</DialogButton>
            <DialogButton type="submit" variant="primary" icon={editing ? Check : Plus} disabled={!ready || saving}>
              {saving ? t('保存中…') : editing ? t('保存') : t('创建')}
            </DialogButton>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  )
}

// useMatchCount 是有多少张照片符合条件：条件停止变化 300 毫秒后去服务器数一次。
// 返回 undefined 表示条件没填完整，null 表示正在数
function useMatchCount(rules: SmartRules | null) {
  const [count, setCount] = useState<number | null | undefined>(undefined)
  const key = rules && rules.rules.every(complete) ? JSON.stringify(rules) : null
  useEffect(() => {
    if (!key) {
      setCount(undefined)
      return
    }
    setCount(null)
    let alive = true
    const timer = window.setTimeout(() => {
      previewSmart(JSON.parse(key))
        .then((n) => alive && setCount(n))
        .catch(() => alive && setCount(undefined))
    }, 300)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [key])
  return count
}
