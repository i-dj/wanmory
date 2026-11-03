// cx 拼接 className，跳过 false / null / undefined，条件样式不用写一长串模板字符串：
//   cx('rounded', active && 'bg-accent', disabled ? 'opacity-40' : 'hover:bg-line')
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
