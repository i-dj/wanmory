import type { ReactNode } from 'react'

// 卡通头像：12 个圆形的小动物，彩色底，画在 64×64 里，纯 SVG（不用下载图片，多大都清楚）。
// 名字要和后端 auth.Cartoons 一致；存在用户的 avatar_style 里，写成 'cartoon:fox'

export const CARTOONS = [
  { id: 'cat', label: '小猫' },
  { id: 'dog', label: '小狗' },
  { id: 'bear', label: '小熊' },
  { id: 'rabbit', label: '兔子' },
  { id: 'panda', label: '熊猫' },
  { id: 'fox', label: '狐狸' },
  { id: 'koala', label: '考拉' },
  { id: 'tiger', label: '老虎' },
  { id: 'pig', label: '小猪' },
  { id: 'frog', label: '青蛙' },
  { id: 'penguin', label: '企鹅' },
  { id: 'owl', label: '猫头鹰' },
] as const
export type CartoonId = (typeof CARTOONS)[number]['id']

const INK = '#2b2522' // 眼睛、鼻子的深色

// 一对眼睛：深色圆点加一个小高光
function Eyes({ y = 32, gap = 9, r = 2.6 }: { y?: number; gap?: number; r?: number }) {
  return (
    <>
      {[32 - gap, 32 + gap].map((x) => (
        <g key={x}>
          <circle cx={x} cy={y} r={r} fill={INK} />
          <circle cx={x + r * 0.35} cy={y - r * 0.4} r={r * 0.35} fill="#fff" />
        </g>
      ))}
    </>
  )
}

// 两边脸蛋的红晕
function Blush({ y = 38, gap = 14, color = '#ff8fa3' }: { y?: number; gap?: number; color?: string }) {
  return (
    <>
      <ellipse cx={32 - gap} cy={y} rx={3.2} ry={2} fill={color} opacity={0.55} />
      <ellipse cx={32 + gap} cy={y} rx={3.2} ry={2} fill={color} opacity={0.55} />
    </>
  )
}

// 小嘴：ω 形
const Mouth = ({ y = 41 }: { y?: number }) => (
  <path
    d={`M28.5 ${y} q1.75 2 3.5 0 q1.75 2 3.5 0`}
    fill="none"
    stroke={INK}
    strokeWidth={1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
)

const DRAWINGS: Record<CartoonId, { bg: string; art: ReactNode }> = {
  cat: {
    bg: '#fde1c3',
    art: (
      <>
        <path d="M15 27 L17 11 L27 19 Z" fill="#f2a15a" />
        <path d="M49 27 L47 11 L37 19 Z" fill="#f2a15a" />
        <path d="M18 23 L19 15 L24.5 19.5 Z" fill="#ffc9b5" />
        <path d="M46 23 L45 15 L39.5 19.5 Z" fill="#ffc9b5" />
        <ellipse cx="32" cy="35" rx="19" ry="16" fill="#f2a15a" />
        <path d="M27 20 q5 4 10 0" fill="none" stroke="#d9823c" strokeWidth={2} strokeLinecap="round" />
        <Eyes y={33} />
        <path d="M30.5 37.5 h3 l-1.5 1.8 Z" fill="#e2687a" />
        <Mouth y={40} />
        <path
          d="M12 37 h8 M12.5 41 l7.5 -1.5 M52 37 h-8 M51.5 41 l-7.5 -1.5"
          stroke={INK}
          strokeWidth={0.9}
          strokeLinecap="round"
          opacity={0.6}
        />
      </>
    ),
  },
  dog: {
    bg: '#cfe6ff',
    art: (
      <>
        <ellipse cx="32" cy="35" rx="17" ry="16" fill="#c98e5f" />
        <ellipse cx="14.5" cy="31" rx="5.5" ry="11" fill="#8a5a3b" transform="rotate(18 14.5 31)" />
        <ellipse cx="49.5" cy="31" rx="5.5" ry="11" fill="#8a5a3b" transform="rotate(-18 49.5 31)" />
        <ellipse cx="38" cy="29" rx="6" ry="5" fill="#a9724a" />
        <Eyes y={31} gap={7.5} />
        <ellipse cx="32" cy="41" rx="8" ry="6" fill="#f1d7bd" />
        <ellipse cx="32" cy="38.5" rx="3" ry="2.2" fill={INK} />
        <path d="M32 40.5 v2 M29.5 43 q2.5 1.8 5 0" fill="none" stroke={INK} strokeWidth={1.3} strokeLinecap="round" />
      </>
    ),
  },
  bear: {
    bg: '#eadfce',
    art: (
      <>
        <circle cx="17" cy="20" r="6.5" fill="#9b6b48" />
        <circle cx="47" cy="20" r="6.5" fill="#9b6b48" />
        <circle cx="17" cy="20" r="3.3" fill="#d6ab84" />
        <circle cx="47" cy="20" r="3.3" fill="#d6ab84" />
        <circle cx="32" cy="34" r="18" fill="#9b6b48" />
        <Eyes y={31} gap={7.5} />
        <ellipse cx="32" cy="40" rx="8" ry="6.2" fill="#d6ab84" />
        <ellipse cx="32" cy="37.6" rx="2.8" ry="2" fill={INK} />
        <path
          d="M32 39.5 v1.6 M29.6 42 q2.4 1.6 4.8 0"
          fill="none"
          stroke={INK}
          strokeWidth={1.3}
          strokeLinecap="round"
        />
      </>
    ),
  },
  rabbit: {
    bg: '#ffdfeb',
    art: (
      <>
        <ellipse cx="24.5" cy="15" rx="4.6" ry="12" fill="#fff" transform="rotate(-8 24.5 15)" />
        <ellipse cx="39.5" cy="15" rx="4.6" ry="12" fill="#fff" transform="rotate(8 39.5 15)" />
        <ellipse cx="24.5" cy="15.5" rx="2.2" ry="8.5" fill="#ffb8cc" transform="rotate(-8 24.5 15.5)" />
        <ellipse cx="39.5" cy="15.5" rx="2.2" ry="8.5" fill="#ffb8cc" transform="rotate(8 39.5 15.5)" />
        <ellipse cx="32" cy="38" rx="16.5" ry="14.5" fill="#fff" />
        <Eyes y={36} gap={7.5} />
        <Blush y={41} gap={11} />
        <path d="M30.5 40 h3 l-1.5 1.6 Z" fill="#ff8fa3" />
        <Mouth y={42.5} />
      </>
    ),
  },
  panda: {
    bg: '#d6efdd',
    art: (
      <>
        <circle cx="17.5" cy="19.5" r="6.2" fill={INK} />
        <circle cx="46.5" cy="19.5" r="6.2" fill={INK} />
        <circle cx="32" cy="34" r="18" fill="#fff" />
        <ellipse cx="24" cy="32" rx="5" ry="6.4" fill={INK} transform="rotate(30 24 32)" />
        <ellipse cx="40" cy="32" rx="5" ry="6.4" fill={INK} transform="rotate(-30 40 32)" />
        <circle cx="24.6" cy="31.5" r="1.9" fill="#fff" />
        <circle cx="39.4" cy="31.5" r="1.9" fill="#fff" />
        <ellipse cx="32" cy="39" rx="2.8" ry="2" fill={INK} />
        <path
          d="M32 41 v1.4 M29.6 43.4 q2.4 1.6 4.8 0"
          fill="none"
          stroke={INK}
          strokeWidth={1.3}
          strokeLinecap="round"
        />
        <Blush y={41} gap={12} />
      </>
    ),
  },
  fox: {
    bg: '#ffe6cf',
    art: (
      <>
        <path d="M13 28 L15 9 L27 20 Z" fill="#ef8434" />
        <path d="M51 28 L49 9 L37 20 Z" fill="#ef8434" />
        <path d="M15.5 13 L15 9 L19 12.5 Z" fill={INK} />
        <path d="M48.5 13 L49 9 L45 12.5 Z" fill={INK} />
        <path d="M13 28 Q14 18 32 18 Q50 18 51 28 Q50 44 32 52 Q14 44 13 28 Z" fill="#ef8434" />
        <path d="M14 31 Q24 33 32 42 Q40 33 50 31 Q48 45 32 52 Q16 45 14 31 Z" fill="#fff6ec" />
        <Eyes y={31} gap={8.5} />
        <ellipse cx="32" cy="43" rx="2.6" ry="1.9" fill={INK} />
      </>
    ),
  },
  koala: {
    bg: '#dbe6f1',
    art: (
      <>
        <circle cx="14" cy="25" r="9" fill="#9aa5b1" />
        <circle cx="50" cy="25" r="9" fill="#9aa5b1" />
        <circle cx="14" cy="25" r="5.5" fill="#e6eaee" />
        <circle cx="50" cy="25" r="5.5" fill="#e6eaee" />
        <ellipse cx="32" cy="35" rx="16.5" ry="16" fill="#9aa5b1" />
        <Eyes y={31} gap={8} r={2.4} />
        <ellipse cx="32" cy="38" rx="4.6" ry="6" fill="#4a4f57" />
        <ellipse cx="30.6" cy="35.5" rx="1.2" ry="1.6" fill="#fff" opacity={0.5} />
        <Blush y={41} gap={11} />
      </>
    ),
  },
  tiger: {
    bg: '#fff0c4',
    art: (
      <>
        <circle cx="17" cy="19" r="6" fill="#f4a227" />
        <circle cx="47" cy="19" r="6" fill="#f4a227" />
        <circle cx="17" cy="19" r="3" fill="#fff6e0" />
        <circle cx="47" cy="19" r="3" fill="#fff6e0" />
        <ellipse cx="32" cy="34" rx="18" ry="17" fill="#f4a227" />
        <path
          d="M28 19 l1.5 5 M32 18 v6 M36 19 l-1.5 5 M14.5 31 h5 M14.8 35 h4.5 M49.5 31 h-5 M49.2 35 h-4.5"
          stroke={INK}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <Eyes y={31} gap={7.5} />
        <ellipse cx="32" cy="41" rx="9" ry="6.5" fill="#fff6e0" />
        <path d="M30 37.5 h4 l-2 2.2 Z" fill="#e2687a" />
        <Mouth y={41.5} />
      </>
    ),
  },
  pig: {
    bg: '#ffe2de',
    art: (
      <>
        <path d="M14 24 L16 12 L25 18 Z" fill="#f2a0b2" />
        <path d="M50 24 L48 12 L39 18 Z" fill="#f2a0b2" />
        <ellipse cx="32" cy="35" rx="18" ry="16" fill="#f7b5c3" />
        <Eyes y={30} gap={8} r={2.4} />
        <ellipse cx="32" cy="39" rx="7.5" ry="5.5" fill="#ef8ea4" />
        <ellipse cx="29.3" cy="39" rx="1.4" ry="2" fill="#b4566c" />
        <ellipse cx="34.7" cy="39" rx="1.4" ry="2" fill="#b4566c" />
        <Blush y={36} gap={13} color="#ff6f91" />
      </>
    ),
  },
  frog: {
    bg: '#dff4d4',
    art: (
      <>
        <ellipse cx="32" cy="38" rx="20" ry="14" fill="#74c27a" />
        <circle cx="21" cy="25" r="7.5" fill="#74c27a" />
        <circle cx="43" cy="25" r="7.5" fill="#74c27a" />
        <circle cx="21" cy="25" r="5" fill="#fff" />
        <circle cx="43" cy="25" r="5" fill="#fff" />
        <circle cx="22" cy="26" r="2.6" fill={INK} />
        <circle cx="42" cy="26" r="2.6" fill={INK} />
        <path d="M22 40 Q32 48 42 40" fill="none" stroke="#2f6b3a" strokeWidth={1.8} strokeLinecap="round" />
        <Blush y={40} gap={15} />
      </>
    ),
  },
  penguin: {
    bg: '#d6eaff',
    art: (
      <>
        <ellipse cx="32" cy="34" rx="18" ry="18" fill="#2f3546" />
        <path d="M32 26 Q36 20 43 23 Q49 28 46 38 Q42 49 32 50 Q22 49 18 38 Q15 28 21 23 Q28 20 32 26 Z" fill="#fff" />
        <Eyes y={33} gap={7} r={2.3} />
        <path d="M28.5 38 L35.5 38 L32 42.5 Z" fill="#f6a23a" />
        <Blush y={41} gap={11} />
      </>
    ),
  },
  owl: {
    bg: '#ece0ff',
    art: (
      <>
        <path d="M15 22 L19 11 L25 19 Z" fill="#8a6a5c" />
        <path d="M49 22 L45 11 L39 19 Z" fill="#8a6a5c" />
        <ellipse cx="32" cy="35" rx="18" ry="17" fill="#8a6a5c" />
        <ellipse cx="32" cy="42" rx="10" ry="8" fill="#c9ad9c" />
        <circle cx="24" cy="30" r="7" fill="#fff" />
        <circle cx="40" cy="30" r="7" fill="#fff" />
        <circle cx="24" cy="30" r="4" fill="#f6a23a" />
        <circle cx="40" cy="30" r="4" fill="#f6a23a" />
        <circle cx="24" cy="30" r="2.2" fill={INK} />
        <circle cx="40" cy="30" r="2.2" fill={INK} />
        <circle cx="24.8" cy="29.2" r="0.8" fill="#fff" />
        <circle cx="40.8" cy="29.2" r="0.8" fill="#fff" />
        <path d="M30 35 L34 35 L32 39 Z" fill="#f6a23a" />
      </>
    ),
  },
}

// CartoonAvatar 画一个卡通头像（圆形）。名字不认识时画一个空的彩色圆
export function CartoonAvatar({ id, className }: { id: string; className?: string }) {
  const d = DRAWINGS[id as CartoonId]
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <clipPath id={`cartoon-${id}`}>
        <circle cx="32" cy="32" r="32" />
      </clipPath>
      <g clipPath={`url(#cartoon-${id})`}>
        <rect width="64" height="64" fill={d?.bg ?? '#ddd'} />
        {d?.art}
      </g>
    </svg>
  )
}
