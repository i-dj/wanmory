// 智能相册的条件：有哪些字段，每种字段能怎么比较，值怎么填。和后端 internal/assets/smart.go 对应。

import type { SmartRule } from './api'
import { t } from '@/i18n'

export type FieldKind = 'date' | 'text' | 'number' | 'rating' | 'photo' | 'flash' | 'album'

export interface FieldDef {
  key: string
  label: string
  kind: FieldKind
  placeholder?: string // 数字字段的输入提示
  prefix?: string // 值前面的单位，例如光圈的 f/
  suffix?: string // 值后面的单位，例如焦距的 mm
  suggest?: 'camera' | 'make' | 'lens' // 文字字段可以下拉提示照片里出现过的值
}

// 字段分两组，和 macOS「照片」一样：常用的在上面，拍摄参数在下面
export const FIELD_GROUPS: FieldDef[][] = [
  [
    { key: 'album', label: t('相册'), kind: 'album' },
    { key: 'taken', label: t('拍摄日期'), kind: 'date' },
    { key: 'added', label: t('添加日期'), kind: 'date' },
    { key: 'filename', label: t('文件名'), kind: 'text' },
    { key: 'photo', label: t('照片'), kind: 'photo' },
    { key: 'rating', label: t('星级'), kind: 'rating' },
  ],
  [
    { key: 'aperture', label: t('光圈'), kind: 'number', placeholder: '2.8', prefix: 'f/' },
    { key: 'camera', label: t('相机型号'), kind: 'text', suggest: 'camera' },
    { key: 'make', label: t('相机品牌'), kind: 'text', suggest: 'make' },
    { key: 'flash', label: t('闪光灯'), kind: 'flash' },
    { key: 'focal', label: t('焦距'), kind: 'number', placeholder: '35', suffix: 'mm' },
    { key: 'iso', label: 'ISO', kind: 'number', placeholder: '400' },
    { key: 'lens', label: t('镜头'), kind: 'text', suggest: 'lens' },
    { key: 'shutter', label: t('快门速度'), kind: 'number', placeholder: '1/125', suffix: t('秒') },
  ],
]

export const FIELDS: Record<string, FieldDef> = Object.fromEntries(FIELD_GROUPS.flat().map((f) => [f.key, f]))

export const OPS: Record<FieldKind, [op: string, label: string][]> = {
  date: [
    ['is', t('是')],
    ['is_not', t('不是')],
    ['after', t('晚于')],
    ['before', t('早于')],
    ['in_last', t('在最近')],
    ['not_in_last', t('不在最近')],
    ['in_range', t('在范围内')],
  ],
  text: [
    ['includes', t('包含')],
    ['excludes', t('不包含')],
    ['is', t('是')],
    ['is_not', t('不是')],
    ['starts', t('开头是')],
    ['ends', t('结尾是')],
    ['empty', t('为空')],
    ['not_empty', t('不为空')],
  ],
  number: [
    ['is', t('是')],
    ['is_not', t('不是')],
    ['gt', t('大于')],
    ['lt', t('小于')],
  ],
  rating: [
    ['is', t('是')],
    ['is_not', t('不是')],
    ['gt', t('高于')],
    ['lt', t('低于')],
  ],
  photo: [
    ['is', t('是')],
    ['is_not', t('不是')],
  ],
  flash: [
    ['is', t('是')],
    ['is_not', t('不是')],
  ],
  album: [
    ['is', t('是')],
    ['is_not', t('不是')],
  ],
}

export const PHOTO_TYPES: [value: string, label: string][] = [
  ['favorite', t('收藏')],
  ['video', t('视频')],
  ['raw', 'RAW'],
  ['screenshot', t('截图')],
  ['gps', t('带位置信息')],
  ['panorama', t('全景')],
]

export const RATINGS: [value: string, label: string][] = [
  ['0', t('无星级')],
  ['1', t('1 星')],
  ['2', t('2 星')],
  ['3', t('3 星')],
  ['4', t('4 星')],
  ['5', t('5 星')],
]

export const UNITS: [value: string, label: string][] = [
  ['day', t('天')],
  ['week', t('周')],
  ['month', t('个月')],
  ['year', t('年')],
]

const today = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// defaultRule 是换了字段（或比较方式）之后的条件：比较方式用第一个，值给一个合理的默认值
export function defaultRule(field: string, op?: string, albums: { id: string }[] = []): SmartRule {
  const def = FIELDS[field]
  const rule: SmartRule = { field, op: op ?? OPS[def.kind][0][0], value: '' }
  switch (def.kind) {
    case 'date':
      if (rule.op === 'in_last' || rule.op === 'not_in_last') Object.assign(rule, { value: '30', unit: 'day' })
      else if (rule.op === 'in_range') Object.assign(rule, { value: today(), value2: today() })
      else rule.value = today()
      break
    case 'photo':
      rule.value = 'favorite'
      break
    case 'flash':
      rule.value = 'fired'
      break
    case 'rating':
      rule.value = '5'
      break
    case 'album':
      rule.value = albums[0]?.id ?? ''
      break
    case 'text':
      rule.values = []
      break
  }
  return rule
}

// textValues 是文字条件填的值；旧的条件只有 value，也当成一个值
export const textValues = (rule: SmartRule) => rule.values ?? (rule.value ? [rule.value] : [])

// needsValue：「为空」「不为空」不用填值
export const needsValue = (rule: SmartRule) => rule.op !== 'empty' && rule.op !== 'not_empty'

// complete 判断条件填完整了没有，没填完整时不去服务器预览数量
export function complete(rule: SmartRule): boolean {
  if (!needsValue(rule)) return true
  if (FIELDS[rule.field].kind === 'text') return textValues(rule).some((v) => v.trim())
  if (!rule.value.trim()) return false
  return rule.op !== 'in_range' || !!rule.value2
}

export const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
