import { Check, ChevronDown, Globe } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAnchorPosition } from '@/hooks/useAnchorPosition'
import { browserLocale, type Locale, LOCALE_NAMES, LOCALES, locale, savedLocale, setLocale, t } from '@/i18n'
import { setUserLocale } from '@/lib/api'
import { cx } from '@/lib/cx'

// LanguagePicker 是「我的账号」里选界面语言的按钮：地球图标、现在的语言、箭头；
// 点开向上弹出一张磨砂卡片，最上面「跟随浏览器」，下面两列每种语言（用它自己的写法），选中的打勾。
// 选了存到账号上（换了浏览器、手机登录也是这个语言）和这个浏览器里，然后重新加载页面
export default function LanguagePicker() {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const saved = savedLocale()
  // 菜单放到 body 下浮着（设置卡片 overflow-hidden 会把它裁掉），右边和按钮对齐，下面不够就放到上面
  const position = useAnchorPosition(button, open, { minWidth: 320, need: 380, gap: 8, align: 'end' })

  useEffect(() => {
    if (!open) return
    const down = (e: MouseEvent) => {
      const t = e.target as Node
      if (!button.current?.contains(t) && !menu.current?.contains(t)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  const pick = async (l: Locale | '') => {
    setOpen(false)
    if (l === saved) return
    await setUserLocale(l).catch(() => {}) // 演示账号不让存到账号上，只存在浏览器里
    setLocale(l)
  }

  const item = (on: boolean) =>
    cx(
      'flex h-11 w-full items-center justify-between gap-3 rounded-xl px-3.5 text-left text-body transition-colors',
      on ? 'bg-fg/[0.08] font-semibold text-fg' : 'text-fg/85 hover:bg-fg/[0.05]',
    )

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full border border-line bg-fg/[0.04] pr-3 pl-3.5 text-body text-fg transition-colors hover:bg-fg/[0.08]"
      >
        <Globe className="size-4.5 text-fg/70" strokeWidth={1.8} />
        {LOCALE_NAMES[locale()]}
        <ChevronDown className={cx('size-4 text-fg/60 transition-transform', open && 'rotate-180')} />
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={menu}
            role="listbox"
            aria-label={t('界面语言')}
            style={position}
            className="popover-card glass-menu fixed z-50 w-[min(440px,calc(100vw-16px))] overflow-y-auto rounded-[22px] p-2"
          >
            <button
              type="button"
              role="option"
              aria-selected={!saved}
              onClick={() => pick('')}
              className={item(!saved)}
            >
              <span className="min-w-0 truncate">
                {t('跟随浏览器')}
                <span className="ml-1.5 text-muted">{LOCALE_NAMES[browserLocale()]}</span>
              </span>
              {!saved && <Check className="size-4.5 shrink-0 text-accent" strokeWidth={2.2} />}
            </button>
            <div className="mx-2 my-1.5 h-px bg-line" />
            <div className="grid grid-cols-2 gap-1">
              {LOCALES.map((l) => {
                const on = saved === l
                return (
                  <button
                    key={l}
                    type="button"
                    role="option"
                    aria-selected={on}
                    lang={l}
                    onClick={() => pick(l)}
                    className={item(on)}
                  >
                    <span className="truncate">{LOCALE_NAMES[l]}</span>
                    {on && <Check className="size-4.5 shrink-0 text-accent" strokeWidth={2.2} />}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
