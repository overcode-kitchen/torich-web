#!/usr/bin/env node
/**
 * 폰트 스케일 토큰 동기화 검사.
 *
 * 지키는 것
 *   app/globals.css 의 `--text-*`  ==  lib/utils.ts 의 FONT_SIZE_TOKENS
 *                                  ==  scripts/check-hardcoded-fontsize.mjs 의 SCALE
 *
 * ── 왜 이 검사가 필요한가 ────────────────────────────────────────────────────
 * tailwind-merge는 Tailwind v4가 **CSS(`@theme`)에 정의한 테마를 읽지 못한다.**
 * 그래서 `lib/utils.ts`에서 폰트 토큰을 font-size 그룹으로 직접 등록해 준다.
 * 등록이 빠진 토큰은 text-color로 오인돼, `cn()`이 글자색(또는 크기)을 조용히 지운다.
 * 즉 globals.css에 토큰을 추가하고 utils.ts 배열을 깜빡하면 **같은 버그가 재발한다.**
 * 기억에 맡기지 않고 여기서 막는다.
 *
 * 세 번째 대상(fontsize 가드의 SCALE)까지 보는 이유: 그 목록이 어긋나면
 * "가장 가까운 토큰" 안내가 존재하지 않는 토큰을 추천하게 된다.
 *
 * 근거: docs/design-system/02-TOKENS.md · 04-GUARD.md
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()

const CSS = 'app/globals.css'
const UTILS = 'lib/utils.ts'
const GUARD = 'scripts/check-hardcoded-fontsize.mjs'

const USE_COLOR = !process.env.NO_COLOR && Boolean(process.stdout.isTTY || process.env.FORCE_COLOR)
const paint = (code) => (USE_COLOR ? `\x1b[${code}m` : '')
const RED = paint(31)
const GREEN = paint(32)
const DIM = paint(2)
const BOLD = paint(1)
const RESET = paint(0)

const read = (file) => readFileSync(join(ROOT, file), 'utf8')

/** globals.css 의 `--text-caption: …`. `--text-caption--line-height` 는 크기 토큰이 아니므로 뺀다. */
function fromCss() {
  const tokens = []
  for (const m of read(CSS).matchAll(/--text-([a-z0-9-]+)\s*:/g)) {
    if (m[1].includes('--')) continue
    tokens.push(m[1])
  }
  return tokens
}

/** lib/utils.ts 의 `export const FONT_SIZE_TOKENS = [ 'caption', … ]`. */
function fromUtils() {
  const block = read(UTILS).match(/FONT_SIZE_TOKENS\s*=\s*\[([\s\S]*?)\]/)
  if (!block) return null
  return [...block[1].matchAll(/['"]([a-z0-9-]+)['"]/g)].map((m) => m[1])
}

/** check-hardcoded-fontsize.mjs 의 `SCALE = [{ token: 'text-caption', … }]`. */
function fromGuard() {
  const block = read(GUARD).match(/const SCALE\s*=\s*\[([\s\S]*?)\n\]/)
  if (!block) return null
  return [...block[1].matchAll(/token:\s*['"]text-([a-z0-9-]+)['"]/g)].map((m) => m[1])
}

const css = fromCss()
const sources = [
  { file: UTILS, label: 'FONT_SIZE_TOKENS', tokens: fromUtils() },
  { file: GUARD, label: 'SCALE', tokens: fromGuard() },
]

console.log(`${BOLD}[font-token-sync]${RESET} 폰트 스케일 토큰 동기화 — 기준 ${CSS} (${css.length}개)`)

const problems = []

if (css.length === 0) {
  problems.push({
    file: CSS,
    message: '`--text-*` 토큰을 하나도 찾지 못했습니다. @theme 블록이 사라졌거나 형식이 바뀌었습니다.',
  })
}

for (const { file, label, tokens } of sources) {
  if (tokens === null) {
    problems.push({ file, message: `${label} 목록을 찾지 못했습니다. 이름이나 형식이 바뀌었다면 이 검사기도 함께 고칩니다.` })
    continue
  }
  const missing = css.filter((t) => !tokens.includes(t))
  const extra = tokens.filter((t) => !css.includes(t))
  if (missing.length > 0) {
    problems.push({
      file,
      message: `${label} 에 빠진 토큰: ${missing.map((t) => `text-${t}`).join(', ')}`,
      fix: `${CSS} 에는 있는데 여기 없습니다 — 추가하세요. (utils.ts라면 cn()이 이 토큰의 글자색을 지웁니다)`,
    })
  }
  if (extra.length > 0) {
    problems.push({
      file,
      message: `${label} 에만 있는 토큰: ${extra.map((t) => `text-${t}`).join(', ')}`,
      fix: `${CSS} 에서 사라졌거나 이름이 바뀐 토큰입니다 — 제거하거나 이름을 맞추세요.`,
    })
  }
}

if (problems.length > 0) {
  console.log('')
  for (const p of problems) {
    console.log(`  ${RED}✖${RESET} ${BOLD}${p.file}${RESET}  ${p.message}`)
    if (p.fix) console.log(`      ${DIM}${p.fix}${RESET}`)
  }
  console.log('')
  console.log(`  ${RED}${BOLD}불일치 ${problems.length}건${RESET} — 근거: docs/design-system/02-TOKENS.md`)
  console.log(`  ${DIM}세 목록은 항상 같아야 합니다. 예외는 없습니다.${RESET}`)
  console.log('')
  process.exit(1)
}

console.log(`  ${GREEN}✓ 통과${RESET} ${DIM}— ${UTILS} · ${GUARD} 가 ${CSS} 와 일치${RESET}`)
console.log('')
