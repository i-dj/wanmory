#!/usr/bin/env node
// Builds assets/i18n/<locale>.json for the app.
//
// UI text in lib/ is written as Chinese source strings: t('照片'). This script collects every
// t('...') key, looks it up in the web translations (web/src/i18n/locales/<locale>.json) and in
// the app-only strings (i18n/<locale>.json, which win), and writes only the keys the app uses.
//
//   node tool/i18n.mjs          write assets/i18n/*.json, list missing translations
//   node tool/i18n.mjs check    exit 1 when a translation is missing (for CI)

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const webLocales = join(root, '../web/src/i18n/locales')
const appLocales = join(root, 'i18n')
const out = join(root, 'assets/i18n')
const LOCALES = ['en', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR', 'ru', 'it', 'vi']
const check = process.argv[2] === 'check'

function dartFiles(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? dartFiles(p) : p.endsWith('.dart') ? [p] : []
  })
}

// Keys passed to t(), plus server error messages the app shows (they arrive as Chinese text).
const keys = new Set()
for (const f of dartFiles(join(root, 'lib'))) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) keys.add(m[1].replace(/\\(.)/g, '$1'))
  // lib/albums holds label tables (smart album fields, comparisons) translated through a variable:
  // every Chinese string literal there is a key.
  if (f.includes('/lib/albums/')) {
    for (const m of src.matchAll(/'([^'\\]*[\u4e00-\u9fff][^'\\]*)'/g)) keys.add(m[1])
  }
  // Status messages stored for later display: message: '…'
  for (const m of src.matchAll(/message: '((?:[^'\\]|\\.)*)'/g)) keys.add(m[1])
  // Strings thrown as ApiException messages are translated where they are shown.
  for (const m of src.matchAll(/ApiException\([^,]+,\s*'((?:[^'\\]|\\.)*)'\)/g)) keys.add(m[1])
}
for (const k of [
  '名字或密码不对',
  '验证码不对，或者已经过期了',
  '登录已经过期，请重新输入名字和密码',
  '登录已过期，请重新登录',
  '服务器内部错误',
]) {
  keys.add(k)
}

const read = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {})
mkdirSync(out, { recursive: true })
let missing = 0
for (const locale of LOCALES) {
  const web = read(join(webLocales, `${locale}.json`))
  const app = read(join(appLocales, `${locale}.json`))
  const dict = {}
  const gaps = []
  for (const k of [...keys].sort()) {
    const v = app[k] ?? web[k]
    if (v === undefined) gaps.push(k)
    else dict[k] = v
  }
  if (gaps.length) {
    missing += gaps.length
    console.log(`${locale}: ${gaps.length} missing\n  ${gaps.join('\n  ')}`)
  }
  if (!check) writeFileSync(join(out, `${locale}.json`), JSON.stringify(dict, null, 2) + '\n')
}
console.log(`${keys.size} keys, ${missing} missing translations`)
if (check && missing) process.exit(1)
