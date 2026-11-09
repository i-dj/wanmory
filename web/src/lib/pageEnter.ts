// 最近一次切换页面的时间。照片格子据此决定缓存里的缩略图要不要淡入：
// 刚切过来时淡入（不然一下子冒出来很突兀），之后滚动时滚回看过的地方，缓存里的直接显示（淡入反而一闪一闪的）
let enteredAt = performance.now()

export const markPageEnter = () => {
  enteredAt = performance.now()
}

export const sincePageEnter = () => performance.now() - enteredAt
