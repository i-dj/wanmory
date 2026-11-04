import { Check, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import Modal, { Button } from '@/components/ui/Modal'
import {
  facePortraitUrl,
  faceStatus,
  type FaceStatus,
  faceThumbUrl,
  mergePeople,
  type Person,
  renamePerson,
} from '@/lib/api'
import { cx } from '@/lib/cx'
import { personPath } from '@/lib/views'
import { showError } from '@/lib/dialog'
import { useCurrentUser } from '@/lib/session'

const POLL_MS = 4000 // 还在识别时多久刷新一次进度和人物

// PeoplePage 是人脸识别归出来的人物：一张张竖的照片卡片（封面是这个人拍得最好的一张），名字写在左下角
// （点一下就能改，没名字的指上去出现「添加名字」），点卡片看这个人的所有照片。起了名字的排在前面。
// 还在识别时上面显示进度，人物会陆续出现。起的名字和别人重了，会问是不是同一个人、要不要合并。
// 点右上角「选择」后点卡片选人，选了两个以上可以「合并」：同一个人被认成了几个（例如宝宝不同月龄）时用
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
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [merging, setMerging] = useState(false)
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const stopSelecting = () => {
    setSelecting(false)
    setSelected(new Set())
  }
  const chosen = people?.filter((p) => selected.has(p.id)) ?? []

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
    <section className="pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-title font-semibold">人物</h1>
          <p className="mt-1 text-body text-muted">{status ? statusLine(status) : '\u00a0'}</p>
        </div>
        {!!people?.length && !guest && (
          <div className="flex shrink-0 items-center gap-2 pt-1">
            {selecting ? (
              <>
                <span className="text-body text-muted tabular-nums">已选 {selected.size} 个</span>
                <Button primary disabled={selected.size < 2} onClick={() => setMerging(true)}>
                  合并
                </Button>
                <Button onClick={stopSelecting}>完成</Button>
              </>
            ) : (
              <Button onClick={() => setSelecting(true)}>选择</Button>
            )}
          </div>
        )}
      </div>
      {selecting && (
        <p className="mt-3 text-caption text-muted">点照片选人。同一个人被分成了几个时，选上他们点「合并」。</p>
      )}

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

      <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-4">
        {people?.map((p) => (
          <li
            key={p.id}
            className={cx(
              'group relative aspect-3/4 overflow-hidden rounded-[14px] bg-line ring-accent ring-offset-2 ring-offset-page transition has-[a:focus-visible]:ring-2',
              selected.has(p.id) && 'ring-3 ring-select has-[a:focus-visible]:ring-3',
            )}
          >
            <a
              href={personPath(p.id)}
              onClick={(e) => {
                e.preventDefault()
                if (selecting) toggle(p.id)
                else navigate(personPath(p.id))
              }}
              aria-label={p.name || '未命名的人'}
              aria-pressed={selecting ? selected.has(p.id) : undefined}
              className="absolute inset-0 outline-none"
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
              {/* 下面压暗一点，白字的名字才看得清 */}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/60 to-transparent" />
              {selecting && (
                <span
                  className={cx(
                    'absolute inset-0 flex items-center justify-center transition-colors',
                    selected.has(p.id) ? 'bg-select/35' : 'bg-black/10 group-hover:bg-black/20',
                  )}
                >
                  {selected.has(p.id) && <Check className="size-9 text-white drop-shadow" strokeWidth={3} />}
                </span>
              )}
            </a>
            {!selecting && <PersonName person={p} readOnly={guest} onRename={(name) => rename(p, name)} />}
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

      {merging && (
        <MergeDialog
          people={chosen}
          onClose={() => setMerging(false)}
          onMerged={async () => {
            setMerging(false)
            stopSelecting()
            await onChanged()
          }}
        />
      )}
    </section>
  )
}

// MergeDialog 确认合并：合成照片最多的那个人；几个人起过不一样的名字时，选留哪个
function MergeDialog({
  people,
  onClose,
  onMerged,
}: {
  people: Person[]
  onClose: () => void
  onMerged: () => Promise<void>
}) {
  const into = people.reduce((a, b) => (b.assets > a.assets ? b : a))
  const names = [...new Set(people.map((p) => p.name).filter(Boolean))]
  const [name, setName] = useState(names.includes(into.name) ? into.name : (names[0] ?? ''))
  const [busy, setBusy] = useState(false)
  const merge = async () => {
    setBusy(true)
    try {
      await mergePeople(
        people.map((p) => p.id),
        into.id,
        name,
      )
      await onMerged()
    } catch (e) {
      showError('没有合并成功', e)
      setBusy(false)
    }
  }
  return (
    <Modal
      title={`把 ${people.length} 个人合并成一个`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>取消</Button>
          <Button primary disabled={busy} onClick={merge}>
            {busy ? '合并中…' : '合并'}
          </Button>
        </div>
      }
    >
      <div className="px-4 py-4">
        <div className="flex -space-x-3">
          {people.map((p) => (
            <span key={p.id} className="size-14 overflow-hidden rounded-full border-2 border-surface bg-line">
              {p.cover && <img src={faceThumbUrl(p.cover)} alt="" className="size-full object-cover" />}
            </span>
          ))}
        </div>
        <p className="mt-3 text-body">
          他们的 {people.reduce((n, p) => n + p.assets, 0).toLocaleString()} 张照片会归到同一个人下面。
        </p>
        {names.length > 1 && (
          <fieldset className="mt-4">
            <legend className="text-body font-medium">名字不一样，留哪个？</legend>
            <div className="mt-2 flex flex-col gap-1.5">
              {names.map((n) => (
                <label key={n} className="flex items-center gap-2 text-body">
                  <input type="radio" name="merge-name" checked={name === n} onChange={() => setName(n)} />
                  {n}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>
    </Modal>
  )
}

// PersonName 是卡片左下角的名字：点一下变成输入框，回车或点别处保存，Esc 放弃。
// 没起名字时平常不显示，指到卡片上才出现「添加名字」
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
      <span className="absolute bottom-2.5 left-3 max-w-[calc(100%-1.5rem)] truncate text-heading font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
        {person.name}
      </span>
    ) : null
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
        className="absolute inset-x-2 bottom-2 h-8 rounded-control bg-black/60 px-2 text-body font-semibold text-white outline-none placeholder:text-white/60"
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
        'absolute bottom-2.5 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-item text-left text-heading font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.6)] hover:underline',
        !person.name && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
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
    <Modal
      title={`已经有叫「${name}」的人了`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>取消</Button>
          <Button disabled={busy} onClick={() => void onSeparate()}>
            不是同一个人
          </Button>
          <Button primary disabled={busy} onClick={merge}>
            {busy ? '合并中…' : '是，合并'}
          </Button>
        </div>
      }
    >
      <div className="px-4 py-4">
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
  return `${s.people.toLocaleString()} 个人`
}
