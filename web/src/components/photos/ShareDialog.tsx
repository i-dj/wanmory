import { Check, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckMark } from '@/components/ui/Checkbox'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { DialogActions } from '@/components/ui/Modal'
import UserAvatar from '@/components/ui/UserAvatar'
import { useMembers } from '@/hooks/useMembers'
import { type Asset, assetShares, shareWithMembers, unshareFromMembers } from '@/lib/api'
import { cx } from '@/lib/cx'
import { showAlert, showError } from '@/lib/dialog'
import { useCurrentUser } from '@/lib/session'
import { t } from '@/i18n'

// ShareDialog 把选中的照片分享给家里的成员：照片默认只有自己看得到，勾上谁，谁的图库里就有这些照片
// （人物、足迹、分类里也有）；取消勾选就收回。只能分享自己传的，别人分享给我的不能再转出去，写在下面。
// 打开时按现在的分享情况打勾：选中的都分享给了他是勾，只分享了一部分是横线（不动它就保持原样）
export default function ShareDialog({ assets, onClose }: { assets: Asset[]; onClose: () => void }) {
  const { user } = useCurrentUser()
  const members = useMembers()
  const others = useMemo(() => [...members.values()].filter((m) => m.id !== user.id), [members, user.id])
  // 用 ID 拼成的字符串当依赖：选中的照片没变时不会因为父组件重新渲染而再问一遍服务器
  const mineKey = assets
    .filter((a) => a.uploaded_by === user.id)
    .map((a) => a.id)
    .join(',')
  const mine = useMemo(() => (mineKey ? mineKey.split(',') : []), [mineKey])
  const notMine = assets.length - mine.length

  // before：打开时每个人分享了其中几张；chosen：现在的选择，true 全部、false 不分享、undefined 保持原样（一部分）
  const [before, setBefore] = useState<Record<string, number> | null>(null)
  const [chosen, setChosen] = useState<Record<string, boolean | undefined>>({})
  const [saving, setSaving] = useState(false)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    let alive = true
    if (mine.length === 0) {
      setBefore({})
      return
    }
    assetShares(mine).then(
      (r) => alive && setBefore(r.users),
      (e) => alive && (showError(t('没有读到分享情况'), e), close.current()),
    )
    return () => {
      alive = false
    }
  }, [mine])

  const state = (id: string): 'all' | 'some' | 'none' => {
    const c = chosen[id]
    if (c !== undefined) return c ? 'all' : 'none'
    const n = before?.[id] ?? 0
    return n >= mine.length ? 'all' : n > 0 ? 'some' : 'none'
  }
  const toggle = (id: string) => setChosen((c) => ({ ...c, [id]: state(id) !== 'all' }))
  const changed = Object.entries(chosen).some(([id, v]) => {
    const n = before?.[id] ?? 0
    return v ? n < mine.length : n > 0
  })

  const save = async () => {
    setSaving(true)
    try {
      const add = Object.keys(chosen).filter((id) => chosen[id])
      const remove = Object.keys(chosen).filter((id) => chosen[id] === false)
      if (add.length) await shareWithMembers(mine, add)
      if (remove.length) await unshareFromMembers(mine, remove)
      showAlert(add.length && !remove.length ? t('已分享 {n} 项', { n: mine.length }) : t('分享已更新'))
      onClose()
    } catch (e) {
      showError(t('没有分享成功'), e)
      setSaving(false)
    }
  }

  return (
    <Modal title={t('分享给成员')} subtitle={t('{n} 项', { n: mine.length })} icon={UsersRound} onClose={onClose}>
      {mine.length === 0 ? (
        <p className="text-body leading-relaxed text-muted">
          {t('只能分享你自己上传的照片。选中的都是别人分享给你的。')}
        </p>
      ) : others.length === 0 ? (
        <p className="text-body leading-relaxed text-muted">{t('还没有其他成员，可以在「系统设置」里添加。')}</p>
      ) : (
        <>
          <p className="mb-3 text-caption leading-relaxed text-muted">
            {t('照片默认只有你看得到。勾选的成员可以在图库、人物、足迹和分类里看到这些照片。')}
          </p>
          <div className="flex flex-col gap-1">
            {others.map((m) => {
              const s = state(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  role="checkbox"
                  aria-checked={s === 'all' ? true : s === 'some' ? 'mixed' : false}
                  disabled={!before}
                  onClick={() => toggle(m.id)}
                  className="flex items-center gap-3 rounded-control px-2 py-2 text-left text-body transition hover:bg-fg/[0.05] disabled:opacity-50"
                >
                  {s === 'some' ? <MixedMark /> : <CheckMark checked={s === 'all'} />}
                  <UserAvatar user={m} className="size-7 text-caption" />
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  {s === 'some' && (
                    <span className="text-caption text-muted">{t('已分享 {n} 项', { n: before?.[m.id] ?? 0 })}</span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
      {notMine > 0 && mine.length > 0 && (
        <p className="mt-3 text-caption leading-relaxed text-muted">
          {t('另外 {n} 项是别人分享给你的，不能再分享。', { n: notMine })}
        </p>
      )}

      <DialogActions>
        <DialogButton onClick={onClose}>{mine.length === 0 || others.length === 0 ? t('好') : t('取消')}</DialogButton>
        {mine.length > 0 && others.length > 0 && (
          <DialogButton variant="primary" icon={Check} disabled={!changed || saving} onClick={save}>
            {saving ? t('保存中…') : t('保存')}
          </DialogButton>
        )}
      </DialogActions>
    </Modal>
  )
}

// MixedMark：只分享了一部分（复选框里一条横线）
function MixedMark() {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex size-4.5 shrink-0 items-center justify-center rounded-[5px] border border-accent bg-accent text-on-accent',
      )}
    >
      <span className="h-0.5 w-2 rounded-full bg-current" />
    </span>
  )
}
