import { Fragment, type ReactNode } from 'react'
import { t } from './index'

// tx：翻译里要夹着元素（链接、加粗、代码……）时用。占位符 {name} 换成 nodes 里同名的元素，
// 整句话一起翻译（不要把一句话拆成几段分别翻译，别的语言词序不一样）：
//   tx('请修改 {file} 里的 {field}', { file: <code>.env</code>, field: <code>PORT</code> })
export function tx(src: string, nodes: Record<string, ReactNode>): ReactNode {
  const parts = t(src).split(/\{(\w+)\}/)
  return parts.map((p, i) => <Fragment key={i}>{i % 2 ? (p in nodes ? nodes[p] : `{${p}}`) : p}</Fragment>)
}
