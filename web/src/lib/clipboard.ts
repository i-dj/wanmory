// copyText 把文字复制到剪贴板，成功返回 true。
// 浏览器的剪贴板接口只在 HTTPS 或 localhost 下能用；在局域网里用 http://wanmory.local、IP 打开相册时没有它，
// 就退回老办法：放一个看不见的文本框、选中、execCommand('copy')
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 没给权限之类，试老办法
    }
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  ta.remove()
  return ok
}
