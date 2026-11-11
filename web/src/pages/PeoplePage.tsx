import PageHeader from '@/components/layout/PageHeader'
import { PEOPLE_GRID } from '@/components/ui/CoverCard'
import { UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { DialogActions } from '@/components/ui/Modal'
import { facePortraitUrl, faceStatus, type FaceStatus, mergePeople, type Person, renamePerson } from '@/lib/api'
import { cx } from '@/lib/cx'
import { personPath } from '@/lib/views'
import { showError } from '@/lib/dialog'
import { useCurrentUser } from '@/lib/session'

const POLL_MS = 4000 // 还在识别时多久刷新一次进度和人物

// PeoplePage 是人脸识别归出来的人物：一张张竖的大照片（封面是这个人拍得最好的一张），名字和照片张数写在照片下方
// （名字点一下就能改，没名字的显示「添加名字」），点照片看这个人的所有照片。起了名字的排在前面。
// 还在识别时上面显示进度，人物会陆续出现。起的名字和别人重了，会问是不是同一个人、要不要合并。
// 同一个人被认成了几个（例如宝宝不同月龄）时，给他们起同一个名字就会问要不要合并
export default function PeoplePage({
  people,
  navigate,
  onChanged,
}: {
  people: Person[] | null
  navigate: (to: string) => void
  onChanged: () => Promise<void> // 改了名字、识别有进展时刷新人物列表
}) {
  const status = useFaceStatus(onChanged)
  const { guest } = useCurrentUser() // 访客：不能起名字、合并

  // 起名字：和别人重名时先问是不是同一个人
  const [duplicate, setDuplicate] = useState<{ person: Person; other: Person; name: string } | null>(null)
  const rename = async (person: Person, name: string) => {
    const other = people?.find((o) => o.id !== person.id && o.name && sameName(o.name, name))
    if (other) {
      setDuplicate({ person, other, name })
      return
    }
    await saveName(person, name)
  }
  const saveName = async (person: Person, name: string) => {
    try {
      await renamePerson(person.id, name)
      await onChanged()
    } catch (e) {
      showError('名字没有保存成功', e)
    }
  }

  return (
    <section>
      <PageHeader title="人物" subtitle={status ? statusLine(status) : ''} />

      {people && people.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center text-muted">
          <UserRound className="size-12" strokeWidth={1.2} />
          <p className="mt-3 text-body">
            {status && status.pending > 0
              ? '正在找照片里的人脸，同一个人出现几次以后就会出现在这里。'
              : '还没有认出人物。同一个人至少要在 3 张照片里出现，才会单独列出来。'}
          </p>
        </div>
      )}

      <ul className={cx('mt-6', PEOPLE_GRID)}>
        {people?.map((p) => (
          <li key={p.id} className="group">
            <a
              href={personPath(p.id)}
              onClick={(e) => {
                e.preventDefault()
                navigate(personPath(p.id))
              }}
              aria-label={p.name || '未命名的人'}
              className="block aspect-3/4 overflow-hidden rounded-[16px] bg-line ring-accent ring-offset-2 ring-offset-page outline-none transition focus-visible:ring-2"
            >
              {p.cover ? (
                <img
                  src={facePortraitUrl(p.cover)}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <UserRound className="m-auto size-full p-8 text-muted" strokeWidth={1.2} />
              )}
            </a>
            {/* 照片下方：名字（可以改）和照片张数 */}
            <div className="mt-3 px-0.5">
              <PersonName person={p} readOnly={guest} onRename={(name) => rename(p, name)} />
              <div className="mt-0.5 truncate text-body text-muted tabular-nums">{p.assets.toLocaleString()} 项</div>
            </div>
          </li>
        ))}
      </ul>

      {duplicate && (
        <DuplicateNameDialog
          {...duplicate}
          onClose={() => setDuplicate(null)}
          onSeparate={async () => {
            setDuplicate(null)
            await saveName(duplicate.person, duplicate.name)
          }}
          onMerged={async () => {
            setDuplicate(null)
            await onChanged()
          }}
        />
      )}
    </section>
  )
}

// PersonName 是照片下方的名字：点一下变成输入框，回车或点别处保存，Esc 放弃。
// 没起名字时显示灰色的「添加名字」
function PersonName({
  person,
  readOnly,
  onRename,
}: {
  person: Person
  readOnly?: boolean // 访客：只显示名字，不能点了改
  onRename: (name: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(person.name)
  if (readOnly)
    return person.name ? (
      <div className="h-6 truncate text-[17px] font-semibold">{person.name}</div>
    ) : (
      <div className="h-6 text-[17px] text-muted">未命名</div>
    )
  const save = async () => {
    setEditing(false)
    const value = name.trim()
    if (value === person.name) return
    await onRename(value)
    setName(person.name)
  }
  if (editing) {
    return (
      <input
        autoFocus
        value={name}
        maxLength={40}
        placeholder="名字"
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setName(person.name)
            setEditing(false)
          }
        }}
        className="-mx-1.5 block h-6 w-[calc(100%+0.75rem)] rounded-control bg-surface px-1.5 text-[17px] font-semibold ring-2 ring-accent/50 outline-none placeholder:text-muted"
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => {
        setName(person.name)
        setEditing(true)
      }}
      className={cx(
        'block h-6 max-w-full truncate rounded-item text-left text-[17px] font-semibold hover:underline',
        !person.name && 'font-normal text-muted',
      )}
    >
      {person.name || '添加名字'}
    </button>
  )
}

// DuplicateNameDialog：起的名字已经有人用了，问是不是同一个人。是就合并（合到照片多的那个），
// 不是就照样起这个名字（两个人同名）
function DuplicateNameDialog({
  person,
  other,
  name,
  onClose,
  onSeparate,
  onMerged,
}: {
  person: Person
  other: Person
  name: string
  onClose: () => void
  onSeparate: () => Promise<void>
  onMerged: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const merge = async () => {
    setBusy(true)
    const into = person.assets > other.assets ? person : other
    try {
      await mergePeople([person.id, other.id], into.id, name)
      await onMerged()
    } catch (e) {
      showError('没有合并成功', e)
      setBusy(false)
    }
  }
  return (
    <Modal title={`已经有叫「${name}」的人了`} onClose={onClose}>
      <div>
        <div className="flex gap-3">
          {[person, other].map((p) => (
            <span key={p.id} className="aspect-3/4 w-24 overflow-hidden rounded-item bg-line">
              {p.cover && <img src={facePortraitUrl(p.cover)} alt="" className="size-full object-cover" />}
            </span>
          ))}
        </div>
        <p className="mt-3 text-body">
          是同一个人吗？合并后他们的 {(person.assets + other.assets).toLocaleString()} 张照片会归到「{name}」下面。
        </p>
      </div>
      <DialogActions>
        <DialogButton disabled={busy} onClick={() => void onSeparate()}>
          不是同一个人
        </DialogButton>
        <DialogButton variant="primary" disabled={busy} onClick={merge}>
          {busy ? '合并中…' : '是，合并'}
        </DialogButton>
      </DialogActions>
    </Modal>
  )
}

// sameName：名字一样（不管前后空格、大小写）
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// useFaceStatus 读人脸识别的进度；还在识别时定时刷新，顺便刷新人物列表，新认出的人陆续出现
function useFaceStatus(onProgress: () => Promise<void>) {
  const [status, setStatus] = useState<FaceStatus | null>(null)
  useEffect(() => {
    let alive = true
    let timer = 0
    const tick = async () => {
      try {
        const s = await faceStatus()
        if (!alive) return
        setStatus(s)
        if (s.pending > 0) {
          await onProgress()
          timer = window.setTimeout(tick, POLL_MS)
        }
      } catch (e) {
        console.error('读取人脸识别进度失败', e)
      }
    }
    void tick()
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [onProgress])
  return status
}

function statusLine(s: FaceStatus): string {
  if (!s.healthy && s.pending > 0) return `AI 服务连不上（${s.ai}），人脸识别暂停，连上后会自动继续`
  if (s.pending > 0) return `正在识别人脸：已看过 ${s.done.toLocaleString()} 张，还有 ${s.pending.toLocaleString()} 张`
  if (s.people === 0) return s.done > 0 ? `已看过 ${s.done.toLocaleString()} 张照片` : ''
  return `已认出 ${s.people.toLocaleString()} 个人`
}
