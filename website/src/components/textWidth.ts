// SVG 里的文字不会自动换行，各种语言的长度又差很多：先粗略估一下文字有多宽，太长就把字号调小或把框加宽。
// 中日韩文字按 1 个字号宽，拉丁字母按字形大概 0.3–0.8 个字号宽

export function textWidth(s: string, size: number) {
  let w = 0
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0
    if (c >= 0x2e80) w += 1
    else if (/[mwMW@]/.test(ch)) w += 0.82
    else if (/[A-Z]/.test(ch)) w += 0.66
    else if (/[iljtfr.,:;'|!·()\s]/.test(ch)) w += 0.32
    else w += 0.56
  }
  return w * size
}

// 在 maxW 里放得下的字号（不小于 min）
export function fitSize(s: string, maxW: number, size: number, min = 8) {
  const w = textWidth(s, size)
  return w <= maxW ? size : Math.max(min, (size * maxW) / w)
}
