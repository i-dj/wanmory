import { t } from '@/i18n'
// 两步验证窗口里「支持常见验证器」的图标，都是 24×24 的 SVG，可以有好几块不同颜色。
// 2FAS 的路径来自 Simple Icons（https://simpleicons.org，CC0）；Google 身份验证器（彩色的六角星）、
// Microsoft Authenticator（蓝色的锁，中间一个人）是照着它们的 App 图标简化画的。
// 商标归各自的公司所有，这里只用来说明这些 App 能用

export interface IconPart {
  d: string
  fill: string
  transform?: string
}

export interface AuthApp {
  name: string // 鼠标停上去显示的全名
  short: string // 图标下面的名字
  parts: IconPart[]
}

// 六角星的一条臂：从中心往外、外头是圆的
const ARM = 'M10.5 12V4.2a1.5 1.5 0 0 1 3 0V12z'

export const AUTH_APPS: AuthApp[] = [
  {
    name: t('Google 身份验证器'),
    short: 'Google',
    parts: [
      { d: ARM, fill: '#4285F4', transform: 'rotate(0 12 12)' },
      { d: ARM, fill: '#4285F4', transform: 'rotate(60 12 12)' },
      { d: ARM, fill: '#34A853', transform: 'rotate(120 12 12)' },
      { d: ARM, fill: '#34A853', transform: 'rotate(180 12 12)' },
      { d: ARM, fill: '#FBBC04', transform: 'rotate(240 12 12)' },
      { d: ARM, fill: '#EA4335', transform: 'rotate(300 12 12)' },
    ],
  },
  {
    name: 'Microsoft Authenticator',
    short: 'Microsoft',
    parts: [
      { d: 'M7.25 10V7.75a4.75 4.75 0 0 1 9.5 0V10h-2.2V7.75a2.55 2.55 0 0 0-5.1 0V10z', fill: '#0F5CA8' },
      {
        d: 'M4.5 11a2.5 2.5 0 0 1 2.5-2.5h10a2.5 2.5 0 0 1 2.5 2.5v8a3.5 3.5 0 0 1-3.5 3.5H8A3.5 3.5 0 0 1 4.5 19z',
        fill: '#2B8AE0',
      },
      { d: 'M12 11.2a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 1 0 0-4.6z', fill: '#fff' },
      { d: 'M7.9 21.6a4.1 4.1 0 0 1 8.2 0z', fill: '#fff' },
    ],
  },
  {
    name: '2FAS Auth',
    short: '2FAS',
    parts: [
      {
        d: 'M12 0c-.918 0-1.833.12-2.72.355L4.07 1.748a2.64 2.64 0 0 0-1.96 2.547v9.115a7.913 7.913 0 0 0 3.552 6.606l5.697 3.765a1.32 1.32 0 0 0 1.467-.008l5.572-3.752a7.931 7.931 0 0 0 3.493-6.57V4.295a2.638 2.638 0 0 0-1.961-2.547L14.72.355A10.594 10.594 0 0 0 12 0ZM7.383 5.4h9.228c.726 0 1.32.594 1.32 1.32 0 .734-.587 1.32-1.32 1.32H7.383c-.727 0-1.32-.593-1.32-1.32 0-.726.593-1.32 1.32-1.32zM7.38 9.357h3.299c.727 0 1.32.595 1.32 1.32a1.32 1.32 0 0 1-1.318 1.32H7.38c-.726 0-1.32-.592-1.32-1.32 0-.725.594-1.32 1.32-1.32zm0 3.96c.727 0 1.32.593 1.32 1.32 0 .727-.586 1.318-1.32 1.318-.726 0-1.32-.592-1.32-1.318 0-.727.594-1.32 1.32-1.32z',
        fill: '#EC1C24',
      },
    ],
  },
]
