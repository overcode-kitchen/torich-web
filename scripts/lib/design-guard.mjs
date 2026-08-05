/**
 * 디자인 가드 공용 모듈 — 파일 순회 · 주석 마스킹 · 인라인 예외 · 리포트 출력.
 *
 * 외부 의존성 없이 Node 표준 모듈만 쓴다(pnpm install 없이도 CI·훅에서 돌아야 하므로).
 * 규칙 자체는 여기 없다. 규칙과 allowlist는 각 check-*.mjs 상단 상수에 있다.
 *
 * 근거 문서: docs/design-system/03-RULES.md · 04-GUARD.md
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

export const ROOT = process.cwd()

/** 검사 대상 루트. UI 소스만 본다 — 빌드 산출물·ios·스크립트 자신은 대상이 아니다. */
export const SCAN_ROOTS = ['app', 'components']

const SCAN_EXT = ['.ts', '.tsx']
const SKIP_DIR = new Set(['node_modules', '.next', 'out', 'ios', 'server-routes.backup'])

/** SCAN_ROOTS 아래의 .ts/.tsx를 모아 저장소 상대경로로 돌려준다. */
export function collectFiles(roots = SCAN_ROOTS) {
  const files = []
  const walk = (dir) => {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return // 루트가 없는 저장소(부분 체크아웃)에서도 죽지 않는다
    }
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!SKIP_DIR.has(entry.name)) walk(full)
      } else if (SCAN_EXT.some((ext) => entry.name.endsWith(ext))) {
        files.push(relative(ROOT, full))
      }
    }
  }
  for (const root of roots) walk(join(ROOT, root))
  return files.sort()
}

/**
 * 주석 내용을 같은 길이의 공백으로 덮는다.
 *
 * 지우지 않고 '덮는' 이유: 문자열 길이가 그대로여야 매치 인덱스 → 줄/열 계산이 어긋나지 않는다.
 * 주석 속 예시 코드(`// text-[11px] 대신 text-caption`)가 위반으로 잡히는 것을 막는다.
 */
export function maskComments(src) {
  const out = src.split('')
  let mode = 'code' // code | line | block | single | double | backtick
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    const next = src[i + 1]
    if (mode === 'code') {
      if (c === '/' && next === '/') {
        mode = 'line'
        out[i] = ' '
      } else if (c === '/' && next === '*') {
        mode = 'block'
        out[i] = ' '
      } else if (c === "'") mode = 'single'
      else if (c === '"') mode = 'double'
      else if (c === '`') mode = 'backtick'
      continue
    }
    if (mode === 'line') {
      if (c === '\n') mode = 'code'
      else out[i] = ' '
      continue
    }
    if (mode === 'block') {
      if (c === '*' && next === '/') {
        out[i] = ' '
        out[i + 1] = ' '
        i++
        mode = 'code'
      } else if (c !== '\n') out[i] = ' '
      continue
    }
    // 문자열 안 — 내용은 건드리지 않고 종료만 감지한다(색·클래스가 문자열에 들어있으므로).
    if (c === '\\') {
      i++
      continue
    }
    if (
      (mode === 'single' && c === "'") ||
      (mode === 'double' && c === '"') ||
      (mode === 'backtick' && c === '`')
    ) {
      mode = 'code'
    }
  }
  return out.join('')
}

/**
 * 인라인 예외 지시자를 읽는다.
 *   // design-guard-disable-next-line <rule> — 이유
 *   // design-guard-disable-line <rule> — 이유
 * 이유 없이 끄는 것을 막으려고, 이유가 비면 무시한다(= 예외가 걸리지 않는다).
 */
export function readInlineDisables(src, rule) {
  const disabled = new Set()
  const lines = src.split('\n')
  lines.forEach((line, idx) => {
    const m = line.match(/design-guard-disable-(next-line|line)\s+([\w-]+)\s*[—:-]\s*\S/)
    if (!m) return
    if (m[2] !== rule) return
    disabled.add(m[1] === 'next-line' ? idx + 2 : idx + 1) // 1-based
  })
  return disabled
}

/** 문자열 인덱스 → 1-based 줄 번호. */
export function lineOf(src, index) {
  let line = 1
  for (let i = 0; i < index; i++) if (src[i] === '\n') line++
  return line
}

/** 해당 줄의 원문(공백 정리). 리포트에 근거를 같이 보여주려고 쓴다. */
export function lineTextOf(src, line) {
  return (src.split('\n')[line - 1] ?? '').trim().slice(0, 120)
}

/** 경로가 allowlist 접두사/정확일치에 걸리는지. */
export function isAllowlisted(file, allowlist) {
  return allowlist.some((entry) => file === entry || file.startsWith(entry.replace(/\/$/, '') + '/'))
}

// 색은 TTY일 때만. NO_COLOR / 파이프 환경(CI 로그)에서는 이스케이프 없이 평문으로 찍는다.
// FORCE_COLOR=1 은 파이프로 넘길 때도 색을 살린다(문서용 캡처).
const USE_COLOR = !process.env.NO_COLOR && Boolean(process.stdout.isTTY || process.env.FORCE_COLOR)
const paint = (code) => (USE_COLOR ? `\x1b[${code}m` : '')
const RED = paint(31)
const GREEN = paint(32)
const YELLOW = paint(33)
const DIM = paint(2)
const BOLD = paint(1)
const RESET = paint(0)

/**
 * 결과 출력 후 프로세스 종료 코드를 정한다.
 * violations 가 있으면 1 (빌드·커밋이 막히도록), 없으면 0.
 */
export function report({ title, rule, violations, warnings = [], hint, warnHint }) {
  const strict = process.argv.includes('--strict')
  const promoted = strict ? [...violations, ...warnings] : violations
  const shownWarnings = strict ? [] : warnings

  console.log(`${BOLD}[${rule}]${RESET} ${title}`)

  if (promoted.length > 0) {
    console.log('')
    for (const v of promoted) {
      console.log(`  ${RED}✖${RESET} ${BOLD}${v.file}:${v.line}${RESET}  ${RED}${v.match}${RESET}`)
      if (v.text) console.log(`      ${DIM}${v.text}${RESET}`)
      if (v.fix) console.log(`      ${YELLOW}→ ${v.fix}${RESET}`)
    }
    console.log('')
    console.log(`  ${RED}${BOLD}위반 ${promoted.length}건${RESET} — 규칙: docs/design-system/03-RULES.md`)
    if (hint) console.log(`  ${hint}`)
    console.log(
      `  ${DIM}정당한 예외라면 스크립트 상단 allowlist에 근거와 함께 등록하거나,` +
        ` 해당 줄 위에 "// design-guard-disable-next-line ${rule} — 이유" 를 단다.${RESET}`
    )
    console.log('')
    process.exit(1)
  }

  if (shownWarnings.length > 0) {
    const byMatch = new Map()
    for (const w of shownWarnings) byMatch.set(w.match, (byMatch.get(w.match) ?? 0) + 1)
    const top = [...byMatch.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
    console.log(
      `  ${YELLOW}▲ 경고 ${shownWarnings.length}건${RESET} ${DIM}(차단하지 않음)${RESET}` +
        `  ${DIM}${top.map(([m, n]) => `${m}×${n}`).join(' ')}${DIM}${byMatch.size > top.length ? ' …' : ''}${RESET}`
    )
    if (warnHint) console.log(`  ${DIM}${warnHint}${RESET}`)
  }

  console.log(`  ${GREEN}✓ 통과${RESET} ${DIM}— 차단 대상 위반 0건${RESET}`)
  console.log('')
  process.exit(0)
}

/** 파일을 읽어 { raw, masked } 로. 읽기 실패는 조용히 건너뛴다. */
export function readSource(file) {
  try {
    const raw = readFileSync(join(ROOT, file), 'utf8')
    return { raw, masked: maskComments(raw) }
  } catch {
    return null
  }
}
