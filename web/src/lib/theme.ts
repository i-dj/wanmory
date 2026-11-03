import { useEffect, useState } from 'react'

// 主题：跟随系统、浅色、深色。选的记在浏览器里；深色时 <html> 加上 theme-dark 类（颜色变量在 index.css）。
// index.html 里有一小段一样的脚本，页面加载前就先加上，刷新时不会先白一下再变黑
export type Theme = 'system' | 'light' | 'dark'
const KEY = 'wanmory.theme'
const dark = window.matchMedia('(prefers-color-scheme: dark)')

function read(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function apply(theme: Theme) {
  const isDark = theme === 'dark' || (theme === 'system' && dark.matches)
  document.documentElement.classList.toggle('theme-dark', isDark)
}

// initTheme 启动时调一次：按记下的主题设好，跟随系统时系统切换深浅色也跟着变
export function initTheme() {
  apply(read())
  dark.addEventListener('change', () => apply(read()))
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read)
  useEffect(() => {
    try {
      if (theme === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, theme)
    } catch {
      // 存不了就只在这次打开时有效
    }
    apply(theme)
  }, [theme])
  return [theme, setTheme] as const
}
