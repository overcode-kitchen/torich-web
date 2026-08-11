#!/usr/bin/env node
/**
 * 하드코딩 색상 검사기.
 *
 * 막는 것
 *   1. hex 리터럴            #fff · #292A2E · bg-[#ece4f7]
 *   2. 리터럴 색 함수        rgb(41,42,46) · hsl(140,98%,35%)
 *   3. 원시 색 유틸(불투명)  bg-white · bg-black · text-black
 *
 * 막지 않는 것(규칙상 정당)
 *   - 알파가 붙은 원시 유틸  bg-black/50 · bg-white/10  → 유색 면 위 오버레이·스크림(03-RULES)
 *   - 변수를 넣은 색 함수    rgb(var(--landing-panel-rgb) / 0.92) → 토큰 사용이다
 *   - 아래 ALLOWLIST 경로
 *
 * 규칙 근거: docs/design-system/03-RULES.md > 색
 */

import { collectFiles, readSource, readInlineDisables, lineOf, lineTextOf, isAllowlisted, report } from './lib/design-guard.mjs'

const RULE = 'color'

/**
 * 경로 예외 — 왜 예외인지가 이 목록의 존재 이유다. 근거 없이 추가하지 않는다.
 * (상세 근거는 docs/design-system/04-GUARD.md §4)
 */
const ALLOWLIST = [
  // 디자인 시스템 가이드 자체. 원시 색을 화면에 '전시'하는 게 목적이라 토큰으로 바꾸면 기능이 사라진다.
  'app/components/design-system',

  // 외부 브랜드 색 — 우리 토큰으로 대체할 수 없다(구글 로고 규정색 4종).
  'app/components/GoogleLogo.tsx',

  // 차트/캔버스 폴백. getComputedStyle로 CSS 변수를 읽고 실패했을 때만 쓰는 최후 값이라
  // 정의상 CSS 변수를 쓸 수 없는 자리다. 파일당 상수로 모아두는 것까지가 규칙.
  'app/hooks/chart/useChartColors.ts',
  'app/hooks/chart/useChartData.ts',
  'app/hooks/stats/useMoneyChartColors.ts',

  // <canvas> 2D 컨텍스트에 직접 그리는 도토리 벡터 폴백(이미지 로드 전).
  // ctx.fillStyle 은 CSS 변수를 받지 못한다. 값은 torich 브라운 브랜드색.
  'app/utils/acorn-physics.ts',
]

/** 알파가 붙지 않은 원시 색 유틸만 잡는다. bg-white/10 은 통과. */
const PRIMITIVE_UTIL = /(?<![\w-])(bg-white|bg-black|text-black)(?![\w/[-])/g
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g
const COLOR_FN = /\b(?:rgba?|hsla?)\(([^)]*)\)/g

const FIX_HINT = {
  'bg-white': 'bg-card (흰 면) — 다크모드에서 깨지지 않는다',
  'bg-black': 'bg-foreground 또는 알파 스크림 bg-black/50',
  'text-black': 'text-foreground',
}

const violations = []

for (const file of collectFiles()) {
  if (isAllowlisted(file, ALLOWLIST)) continue
  const src = readSource(file)
  if (!src) continue
  const disabled = readInlineDisables(src.raw, RULE)
  const push = (index, match, fix) => {
    const line = lineOf(src.masked, index)
    if (disabled.has(line)) return
    violations.push({ file, line, match, fix, text: lineTextOf(src.raw, line) })
  }

  for (const m of src.masked.matchAll(HEX)) {
    push(m.index, m[0], 'globals.css에 시맨틱 토큰을 정의하고 var(--토큰) / Tailwind 시맨틱 유틸을 쓴다')
  }

  for (const m of src.masked.matchAll(COLOR_FN)) {
    // 인자에 CSS 변수가 들어있으면 토큰을 쓴 것이므로 위반이 아니다.
    if (m[1].includes('var(--')) continue
    push(m.index, m[0].slice(0, 40), 'globals.css의 팔레트 토큰(--palette-*)을 정의하고 var()로 참조한다')
  }

  for (const m of src.masked.matchAll(PRIMITIVE_UTIL)) {
    push(m.index, m[0], FIX_HINT[m[0]])
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

report({
  rule: RULE,
  title: '하드코딩 색상 (hex · rgb()/hsl() · 원시 색 유틸)',
  violations,
  hint: '  색이 필요하면 값을 박지 말고 globals.css에 토큰을 추가한 뒤 그 토큰을 쓴다.',
})
