// 左边菜单的抽屉动画：点进去看照片（某个人、相册、回忆……）时菜单往左收回去，页面同时往左挤过去占满；
// 返回时菜单推回来、页面往右让开。菜单（Sidebar 的 CSS 过渡）和页面（App 里的 Web Animation）用这里同一套时长和缓动，
// 一起动，接缝处始终贴着。只动 transform，不改布局，浏览器用 GPU 合成，不卡
export const DRAWER_OPEN_MS = 300 // 点进去，菜单收回去：快一点
export const DRAWER_CLOSE_MS = 600 // 返回，菜单推回来：慢一点
export const SIDEBAR_WIDTH = 264 // 左边菜单的宽度（Sidebar 的 md:w-66），页面跟着平移这么多
export const DRAWER_EASE = 'cubic-bezier(0.37, 0, 0.63, 1)' // 两头都慢、中间匀速，没有猛地一下
