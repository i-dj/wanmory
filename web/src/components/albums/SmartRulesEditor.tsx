import Tooltip from '@/components/ui/Tooltip'
import { ArrowUpDown, Check, ChevronDown, Plus, X } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { menuItemClass } from '@/components/ui/Popover'
import Select from '@/components/ui/Select'
import { useAnchorPosition } from '@/hooks/useAnchorPosition'
import { type Album, fieldValues, type SmartRule, type SmartRules } from '@/lib/api'
import { cx } from '@/lib/cx'
import {
  defaultRule,
  FIELD_GROUPS,
  FIELDS,
  needsValue,
  OPS,
  PHOTO_TYPES,
  RATINGS,
  textValues,
  UNITS,
} from '@/lib/smartRules'

const MAX_RULES = 20

// SmartRulesEditor 编辑智能相册的条件。每条条件是连成一体的一行：字段 │ 比较方式 │ 值，右边 × 删掉。
// 两条以上时，左边一个「并且 / 或者」按钮，一条细线把各条条件串起来，点按钮在两者之间切换；
// 下面一个「添加条件」。镜头、相机这类文字可以填多个值，显示成小标签。
// albums 是条件「相册 是 …」可以选的相册（自动同步的智能相册不能选，免得互相套）
export default function SmartRulesEditor({
  value,
  onChange,
  albums,
}: {
  value: SmartRules
  onChange: (rules: SmartRules) => void
  albums: Album[]
}) {
  const setRule = (i: number, rule: SmartRule) =>
    onChange({ ...value, rules: value.rules.map((r, j) => (j === i ? rule : r)) })
  const add = () => onChange({ ...value, rules: [...value.rules, defaultRule('photo')] })
  const remove = (i: number) => onChange({ ...value, rules: value.rules.filter((_, j) => j !== i) })
  const multiple = value.rules.length > 1

  return (
    <div>
      <p className="mb-2 text-body text-muted">条件</p>
      <div className="flex gap-2">
        {multiple && (
          // 「并且 / 或者」和串起各条条件的线：线从按钮下面开始，拐到最后一条条件的中间
          <div className="relative flex w-17 shrink-0 flex-col items-start">
            <Tooltip label={value.match === 'all' ? '每条都满足' : '满足任一条'}>
              <button
                type="button"
                onClick={() => onChange({ ...value, match: value.match === 'all' ? 'any' : 'all' })}
                className="flex h-9 w-full items-center justify-center gap-1 rounded-control bg-line/60 text-caption font-semibold tracking-wide transition hover:bg-line active:scale-95"
              >
                {value.match === 'all' ? '并且' : '或者'}
                <ArrowUpDown className="size-3" strokeWidth={2.4} />
              </button>
            </Tooltip>
            <span
              aria-hidden="true"
              className="absolute top-11 bottom-4.5 left-4 w-3 rounded-bl-control border-b border-l border-line"
            />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          {value.rules.map((rule, i) => (
            <RuleRow
              key={i}
              rule={rule}
              albums={albums}
              onChange={(r) => setRule(i, r)}
              onRemove={multiple ? () => remove(i) : undefined}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={add}
        disabled={value.rules.length >= MAX_RULES}
        className="mt-3 inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line bg-fg/[0.04] px-3.5 text-body font-medium whitespace-nowrap text-fg transition-colors hover:bg-fg/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-4" strokeWidth={2.2} />
        添加条件
      </button>
    </div>
  )
}

// RuleRow 是连成一体的一条条件：字段 │ 比较方式 │ 值 │ ×（只有一条时没有 ×）。
// × 放在框里面，每条条件都和上面的相册名输入框一样宽
function RuleRow({
  rule,
  albums,
  onChange,
  onRemove,
}: {
  rule: SmartRule
  albums: Album[]
  onChange: (r: SmartRule) => void
  onRemove?: () => void
}) {
  return (
    <div className="flex h-9 min-w-0 items-stretch divide-x divide-line rounded-control border border-line focus-within:border-line-strong hover:border-line-strong">
      <Select
        bare
        label="字段"
        value={rule.field}
        onChange={(f) => onChange(defaultRule(f, undefined, albums))}
        options={FIELD_GROUPS.flatMap((group, g) => [
          ...(g > 0 ? [null] : []),
          ...group.map((f) => [f.key, f.label] as [string, string]),
        ])}
        className="w-29 shrink-0 [&>button]:rounded-l-control"
      />
      <Select
        bare
        label="比较方式"
        value={rule.op}
        onChange={(op) => onChange(keepValue(rule, op, albums))}
        options={OPS[FIELDS[rule.field].kind]}
        className="w-26 shrink-0"
      />
      <div className="flex min-w-0 flex-1 items-center">
        <ValueInput rule={rule} albums={albums} onChange={onChange} />
      </div>
      {onRemove && (
        <Tooltip label="删除条件">
          <button
            type="button"
            aria-label="删除这条条件"
            onClick={onRemove}
            className="flex w-9 shrink-0 items-center justify-center rounded-r-control text-muted transition-colors hover:bg-line/40 hover:text-fg"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </Tooltip>
      )}
    </div>
  )
}

// keepValue 换比较方式时，能沿用的值就沿用（例如文字「包含」换成「开头是」），日期换成别的填法时给默认值
function keepValue(rule: SmartRule, op: string, albums: Album[]): SmartRule {
  if (FIELDS[rule.field].kind !== 'date') return { ...rule, op }
  const group = (o: string) => (o === 'in_last' || o === 'not_in_last' ? 'last' : o === 'in_range' ? 'range' : 'day')
  return group(op) === group(rule.op) ? { ...rule, op } : defaultRule(rule.field, op, albums)
}

// 值那一段里的输入框：没有边框，和整行融在一起
const bareInput = 'h-full min-w-0 flex-1 bg-transparent px-3 text-body outline-none placeholder:text-muted'

function ValueInput({
  rule,
  albums,
  onChange,
}: {
  rule: SmartRule
  albums: Album[]
  onChange: (rule: SmartRule) => void
}) {
  const def = FIELDS[rule.field]
  const set = (patch: Partial<SmartRule>) => onChange({ ...rule, ...patch })
  if (!needsValue(rule)) return <span className="px-3 text-body text-muted">—</span>

  switch (def.kind) {
    case 'date':
      if (rule.op === 'in_last' || rule.op === 'not_in_last')
        return (
          <>
            <input
              type="number"
              min={1}
              value={rule.value}
              onChange={(e) => set({ value: e.target.value })}
              aria-label="数量"
              className={bareInput}
            />
            <Select
              bare
              label="单位"
              value={rule.unit ?? 'day'}
              onChange={(unit) => set({ unit })}
              options={UNITS}
              className="h-full w-21 shrink-0 border-l border-line [&>button]:rounded-r-control"
            />
          </>
        )
      if (rule.op === 'in_range')
        return (
          <>
            <input
              type="date"
              value={rule.value}
              onChange={(e) => set({ value: e.target.value })}
              aria-label="开始日期"
              className={bareInput}
            />
            <span className="shrink-0 text-caption text-muted">至</span>
            <input
              type="date"
              value={rule.value2 ?? ''}
              onChange={(e) => set({ value2: e.target.value })}
              aria-label="结束日期"
              className={bareInput}
            />
          </>
        )
      return (
        <input
          type="date"
          value={rule.value}
          onChange={(e) => set({ value: e.target.value })}
          aria-label="日期"
          className={bareInput}
        />
      )
    case 'photo':
      return (
        <BareSelect label="照片类型" value={rule.value} onChange={(value) => set({ value })} options={PHOTO_TYPES} />
      )
    case 'flash':
      return (
        <BareSelect
          label="闪光灯"
          value={rule.value}
          onChange={(value) => set({ value })}
          options={[['fired', '闪光']]}
        />
      )
    case 'rating':
      return <BareSelect label="星级" value={rule.value} onChange={(value) => set({ value })} options={RATINGS} />
    case 'album':
      return albums.length > 0 ? (
        <BareSelect
          label="相册"
          value={rule.value}
          onChange={(value) => set({ value })}
          options={albums.map((a) => [a.id, a.name])}
        />
      ) : (
        <span className="px-3 text-caption text-muted">还没有可以选的相册</span>
      )
    case 'number':
      return (
        <>
          {def.prefix && <span className="shrink-0 pl-3 text-caption text-muted">{def.prefix}</span>}
          <input
            value={rule.value}
            onChange={(e) => set({ value: e.target.value })}
            placeholder={def.placeholder}
            aria-label={def.label}
            inputMode="decimal"
            className={cx(bareInput, def.prefix && 'pl-1')}
          />
          {def.suffix && <span className="shrink-0 pr-3 text-caption text-muted">{def.suffix}</span>}
        </>
      )
    case 'text':
      return (
        <TagInput
          values={textValues(rule)}
          onChange={(values) => set({ values, value: '' })}
          suggest={def.suggest}
          label={def.label}
        />
      )
  }
}

function BareSelect(props: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, ReactNode][]
}) {
  return <Select bare {...props} className="h-full min-w-0 flex-1 [&>button]:rounded-r-control" />
}

// TagInput 填多个值。框里放不下所有值，只显示前两个小标签，其余的折成「+N」；
// 有下拉提示时（相机型号、镜头）列出照片里出现过的值，选中的前面打勾，点一下选上或取消，列表不收起，
// 可以连着选好几个；方向键上下移动、回车选。也可以直接打字回车（或逗号）加一个列表里没有的值，退格删掉最后一个
function TagInput({
  values,
  onChange,
  suggest,
  label,
}: {
  values: string[]
  onChange: (values: string[]) => void
  suggest?: 'camera' | 'make' | 'lens'
  label: string
}) {
  const [text, setText] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1) // 键盘移到的那一项
  const box = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const position = useAnchorPosition(box, open, { minWidth: 220 })

  useEffect(() => {
    if (!suggest) return
    let alive = true
    fieldValues(suggest)
      .then((l) => alive && setOptions(l))
      .catch(console.error)
    return () => {
      alive = false
    }
  }, [suggest])

  // 点输入框和下拉列表以外的地方、按 Esc 收起（列表放在 body 下，要两个都算「里面」）
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!box.current?.contains(t) && !list.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation() // 只收起列表，不关掉整个对话框
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const has = (v: string) => values.some((x) => x.toLowerCase() === v.toLowerCase())
  const toggle = (v: string) =>
    onChange(has(v) ? values.filter((x) => x.toLowerCase() !== v.toLowerCase()) : [...values, v])
  const addText = (v: string) => {
    const t = v.trim()
    if (t && !has(t)) onChange([...values, t])
    setText('')
  }
  // 还没按回车的文字也算一个值，免得用户以为填了、保存时却没有
  const commit = () => {
    if (text.trim()) addText(text)
  }

  // 列表：自己打的、列表里没有的值放最前面（也打着勾，点一下可以取消），后面是照片里出现过的值
  const q = text.trim().toLowerCase()
  const items = [...values.filter((v) => !options.some((o) => o.toLowerCase() === v.toLowerCase())), ...options].filter(
    (o) => !q || o.toLowerCase().includes(q),
  )
  const shownChips = values.slice(0, 2)
  const more = values.length - shownChips.length

  return (
    <div
      ref={box}
      className="flex h-full min-w-0 flex-1 cursor-text items-center gap-1 overflow-hidden pr-1 pl-2"
      onClick={() => {
        input.current?.focus()
        setOpen(true)
      }}
    >
      {shownChips.map((v) => (
        <Tooltip key={v} label={v}>
          <span className="flex max-w-33 min-w-0 shrink items-center gap-0.5 rounded-item bg-accent-soft py-0.5 pr-0.5 pl-2 text-caption font-medium text-accent">
            <span className="truncate">{v}</span>
            <button
              type="button"
              aria-label={`去掉 ${v}`}
              onClick={(e) => {
                e.stopPropagation()
                toggle(v)
              }}
              className="flex size-4 shrink-0 items-center justify-center rounded hover:bg-accent/20"
            >
              <X className="size-3" strokeWidth={2.4} />
            </button>
          </span>
        </Tooltip>
      ))}
      {more > 0 && (
        <Tooltip label={values.slice(2).join('、')}>
          <span className="shrink-0 rounded-item bg-line/70 px-1.5 py-0.5 text-caption font-medium text-fg/80 tabular-nums">
            +{more}
          </span>
        </Tooltip>
      )}
      <input
        ref={input}
        value={text}
        onChange={(e) => {
          const v = e.target.value
          if (v.endsWith(',') || v.endsWith('，')) addText(v.slice(0, -1))
          else setText(v)
          setActive(-1)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setOpen(true)
            const step = e.key === 'ArrowDown' ? 1 : -1
            setActive((i) => (items.length ? (i + step + items.length) % items.length : -1))
          } else if (e.key === 'Enter') {
            e.preventDefault() // 不提交整个对话框
            if (open && active >= 0 && items[active]) toggle(items[active])
            else commit()
          } else if (e.key === 'Backspace' && !text && values.length) onChange(values.slice(0, -1))
        }}
        onFocus={() => setOpen(true)}
        onBlur={commit}
        placeholder={values.length ? '' : suggest ? '输入或从列表里选，可以选多个' : '输入后回车，可以填多个'}
        aria-label={label}
        className="h-full min-w-12 flex-1 bg-transparent px-1 text-body outline-none placeholder:text-muted"
      />
      {suggest && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="显示可选的值"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((o) => !o)
          }}
          className="flex size-6 shrink-0 items-center justify-center rounded-control text-muted hover:bg-line/60"
        >
          <ChevronDown className={cx('size-3.5 transition-transform', open && 'rotate-180')} strokeWidth={2.2} />
        </button>
      )}
      {open &&
        suggest &&
        items.length > 0 &&
        position &&
        // 放到 body 下、按输入框的位置固定定位：列表可以伸出对话框，对话框不会因此出现滚动条
        createPortal(
          <div
            ref={list}
            role="listbox"
            aria-multiselectable="true"
            style={position}
            className="popover-card glass-menu fixed z-60 overflow-y-auto rounded-panel p-1"
          >
            {items.map((o, i) => {
              const checked = has(o)
              return (
                <button
                  key={o}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onMouseDown={(e) => e.preventDefault()} // 不让输入框失焦，免得没打完的字先被加成标签
                  onMouseEnter={() => setActive(i)}
                  onClick={() => toggle(o)}
                  className={cx(menuItemClass, 'gap-2 pr-4 pl-2', i === active && 'bg-fg/[0.07]')}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {checked && <Check className="size-4 text-accent" strokeWidth={2.6} />}
                  </span>
                  <span className={cx('min-w-0 flex-1 truncate', checked && 'font-medium')}>{o}</span>
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}
