#!/usr/bin/env node
/**
 * 임의 간격 검사기 (4px 그리드).
 *
 * 막는 것 (exit 1)
 *   4의 배수를 벗어난 임의 간격 브래킷 — p-[13px] · gap-[7px] · mt-[1.5rem]
 *
 * 경고만 (차단 안 함)
 *   승인되지 않은 하프스텝 — p-0.5(2px) · py-3.5(14px)
 *   03-RULES는 1.5(6px)·2.5(10px)만 micro 예외로 허용한다. 나머지는 정리 대상이지만,
 *   치환하면 실제 여백이 2px씩 바뀌어 눈검증이 필요하다 → 차단 대신 가시화만 한다.
 *   (`--strict` 로 실행하면 이것도 에러로 올라간다.)
 *
 * 막지 않는 것(규칙상 정당)
 *   상대 단위·동적 값     mb-[6%] · h-[50vh] · gap-[var(--x)] · pb-[calc(env(safe-area-inset-bottom)+0.75rem)]
 *   3px 이하 미세 물리 간격  gap-[3px] — 헤어라인·조밀 그리드 거터. 4px 그리드의 대상이 아니다.
 *
 * 규칙 근거: docs/design-system/03-RULES.md > 간격
 */

import { collectFiles, readSource, readInlineDisables, lineOf, lineTextOf, isAllowlisted, report } from './lib/design-guard.mjs'

const RULE = 'spacing'

/** 경로 예외 — 근거는 04-GUARD.md §4. 현재는 없다(간격은 전 파일 동일 기준). */
const ALLOWLIST = []

/** 4px 그리드를 적용할 수 없는 물리 픽셀의 상한. 1px·2px 보더, 3px 조밀 거터가 여기 해당. */
const MICRO_PX_MAX = 3

/** 승인된 하프스텝(03-RULES: 인라인 칩/작은 버튼 전용). */
const APPROVED_HALF_STEPS = new Set(['1.5', '2.5'])

const SPACING_PROPS = 'p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y'

/** -mt-[12px] 같은 음수 접두사까지 포함해 잡는다. */
const ARBITRARY = new RegExp(`(?<![\\w-])-?(?:${SPACING_PROPS})-\\[([^\\]]+)\\]`, 'g')
const HALF_STEP = new RegExp(`(?<![\\w-])-?(?:${SPACING_PROPS})-(\\d+\\.5)(?![\\w.])`, 'g')

/** 브래킷 값이 px 환산 가능한 고정 길이면 px를, 아니면 null(=검사 대상 아님)을 준다. */
function toPx(value) {
  const v = value.trim()
  if (/var\(|calc\(|env\(|clamp\(|min\(|max\(/.test(v)) return null // 동적 값
  const m = v.match(/^(-?\d*\.?\d+)(px|rem)$/)
  if (!m) return null // %, vh, vw, dvh, fr, ch, auto … 상대 단위는 4px 그리드 대상이 아니다
  const n = parseFloat(m[1])
  return m[2] === 'rem' ? n * 16 : n
}

const violations = []
const warnings = []

for (const file of collectFiles()) {
  if (isAllowlisted(file, ALLOWLIST)) continue
  const src = readSource(file)
  if (!src) continue
  const disabled = readInlineDisables(src.raw, RULE)
  const at = (index) => lineOf(src.masked, index)

  for (const m of src.masked.matchAll(ARBITRARY)) {
    const px = toPx(m[1])
    if (px === null) continue
    const abs = Math.abs(px)
    if (abs <= MICRO_PX_MAX) continue // 미세 물리 간격 — 문서화된 예외
    if (abs % 4 === 0) continue // 그리드 위에 있음(브래킷일 뿐 값은 정상)
    const line = at(m.index)
    if (disabled.has(line)) continue
    const lower = Math.floor(abs / 4) * 4
    violations.push({
      file,
      line,
      match: m[0],
      fix: `4px 스텝으로: ${lower / 4}(${lower}px) 또는 ${lower / 4 + 1}(${lower + 4}px)`,
      text: lineTextOf(src.raw, line),
    })
  }

  for (const m of src.masked.matchAll(HALF_STEP)) {
    if (APPROVED_HALF_STEPS.has(m[1])) continue
    const line = at(m.index)
    if (disabled.has(line)) continue
    warnings.push({ file, line, match: m[0], text: lineTextOf(src.raw, line) })
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

report({
  rule: RULE,
  title: '임의 간격 (4px 그리드 이탈)',
  violations,
  warnings,
  hint: '  4의 배수 스텝만 쓴다: 1(4) 2(8) 3(12) 4(16) 6(24) 8(32) 12(48). 브래킷 값을 새로 만들지 않는다.',
  warnHint:
    '미승인 하프스텝(0.5=2px·3.5=14px). 03-RULES는 1.5·2.5만 허용한다 — 정리 대상이지만 값이 바뀌므로 차단하지 않는다.',
})
