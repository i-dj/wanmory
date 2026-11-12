// 翻译表的检查和整理：
//   node scripts/i18n.mjs check            每种语言还缺几句（缺的会先用英文，英文也缺显示中文原文）
//   node scripts/i18n.mjs missing <语言>    打印那种语言缺的句子（JSON，值是中文原文，翻译好替换掉值再合并进去）
//   node scripts/i18n.mjs merge <语言> <文件> 把翻译好的 JSON 合并进 src/i18n/locales/<语言>.json
//   node scripts/i18n.mjs prune            删掉代码里已经不用的句子
//   node scripts/i18n.mjs zh-tw            用 OpenCC 把简体原文转成繁体（台湾用词），重写 zh-TW.json
//
// 要翻译的句子：前端代码里 t('…') / tr('…') 的中文原文，加上后端回给网页的中文错误提示
// （httpx.Error、errors.New 里不带 % 的字符串，网页显示前用同一张翻译表换掉，见 lib/api.ts 的 serverText）

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const web = join(dirname(fileURLToPath(import.meta.url)), '..')
const repo = join(web, '..')
const dir = join(web, 'src/i18n/locales')
const LOCALES = ['en', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR', 'ru', 'it', 'vi']
const CJK = /[　-〿一-鿿＀-￯]/
// 只有开发者会看到的接口错误、内部错误：只要求英文，其他语言缺了显示英文
const DEV = /asset_id|应该是|DATABASE_URL|exiftool|着色器|useCurrentUser|multipart|cursor 格式|city 里|刚建的会话/

function files(d, ext, out = []) {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== 'locales') files(p, ext, out)
    } else if (ext.test(f) && !f.endsWith('_test.go')) out.push(p)
  }
  return out
}

const unescapeJS = (s) => s.replace(/\\(.)/g, (_, c) => ({ n: '\n', t: '\t' })[c] ?? c)

export function keys() {
  const set = new Set()
  for (const p of files(join(web, 'src'), /\.(ts|tsx)$/)) {
    for (const m of readFileSync(p, 'utf8').matchAll(/\b(?:t|tr|st|tx)\(\s*'((?:[^'\\]|\\.)*)'/g)) {
      const k = unescapeJS(m[1])
      if (CJK.test(k)) set.add(k)
    }
  }
  for (const p of files(join(repo, 'server'), /\.go$/)) {
    const src = readFileSync(p, 'utf8')
    for (const m of src.matchAll(/(?:httpx\.Error\(w, [^,]+, |errors\.New\()"((?:[^"\\]|\\.)*)"/g)) {
      const k = JSON.parse(`"${m[1]}"`)
      if (CJK.test(k) && !k.includes('%')) set.add(k)
    }
  }
  return [...set].sort()
}

const load = (l) => {
  try {
    return JSON.parse(readFileSync(join(dir, `${l}.json`), 'utf8'))
  } catch {
    return {}
  }
}
const save = (l, obj) => {
  const sorted = Object.fromEntries(
    Object.keys(obj)
      .sort()
      .map((k) => [k, obj[k]]),
  )
  writeFileSync(join(dir, `${l}.json`), JSON.stringify(sorted, null, 2) + '\n')
}

const [cmd, a, b] = process.argv.slice(2)
const all = keys()
if (cmd === 'check') {
  console.log(`${all.length} 句`)
  for (const l of LOCALES) {
    const cat = load(l)
    const need = l === 'en' ? all : all.filter((k) => !DEV.test(k))
    console.log(`${l.padEnd(6)} 缺 ${need.filter((k) => !(k in cat)).length}`)
  }
} else if (cmd === 'missing') {
  const cat = load(a)
  const need = a === 'en' ? all : all.filter((k) => !DEV.test(k))
  console.log(JSON.stringify(Object.fromEntries(need.filter((k) => !(k in cat)).map((k) => [k, k])), null, 1))
} else if (cmd === 'merge') {
  const cat = load(a)
  const add = JSON.parse(readFileSync(b, 'utf8'))
  let n = 0
  for (const [k, v] of Object.entries(add)) {
    if (!all.includes(k)) {
      console.warn(`代码里没有：${k}`)
      continue
    }
    cat[k] = v
    n++
  }
  save(a, cat)
  console.log(`${a}: 合并 ${n} 句`)
} else if (cmd === 'prune') {
  for (const l of LOCALES) {
    const cat = load(l)
    save(l, Object.fromEntries(Object.entries(cat).filter(([k]) => all.includes(k))))
  }
} else if (cmd === 'zh-tw') {
  // 和官网用同一个 Python 环境（website/.venv，装了 opencc-python-reimplemented）
  const out = execFileSync(join(repo, 'website/.venv/bin/python'), [join(web, 'scripts/zh-tw.py')], {
    input: JSON.stringify(all),
  })
  save('zh-TW', JSON.parse(out))
  console.log(`zh-TW: ${all.length} 句`)
} else {
  console.log('用法见文件开头')
}
