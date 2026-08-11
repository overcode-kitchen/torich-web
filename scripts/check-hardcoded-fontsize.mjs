#!/usr/bin/env node
/**
 * 임의 폰트 크기 검사기.
 *
 * 막는 것
 *   text-[11px] · text-[0.8rem] · text-[2rem] · style={{ fontSize: 15 }}
 *
 * 막지 않는 것
 *   text-[var(--brand-accent-text)]  → 대괄호지만 '색' 유틸이다(색 검사기 소관)
 *   text-[#fff]                      → 위와 같음
 *   아래 BASELINE 에 동결된 기존 부채
 *
 * ── 베이스라인(ratchet) 방식인 이유 ────────────────────────────────────────
 * 이 저장소의 임의 px는 33건인데, **어느 것도 스케일 토큰과 값이 같지 않다**
 * (11·10·15·17·26·28·32·34px, 0.8rem, 2rem vs 12·14·16·20·24·30px).
 * 즉 전부 '치환하면 화면에 보이는 크기가 바뀌는' 건이다. 그래서 일괄 치환하지 않고
 * 파일별 현재 건수를 동결한다 — 늘어나면 막고, 줄이면 통과한다.
 * 근거·이관 계획: docs/design-system/04-GUARD.md §4·§7
 *
 * 규칙 근거: docs/design-system/03-RULES.md > 글자
 */

import { collectFiles, readSource, readInlineDisables, lineOf, lineTextOf, isAllowlisted, report } from './lib/design-guard.mjs'

const RULE = 'fontsize'

/** 경로 예외 — 근거는 04-GUARD.md §4. */
const ALLOWLIST = [
  // 스타일 가이드의 '타입 스케일' 데모는 각 단계를 원시값과 함께 보여주는 게 목적이다.
  'app/components/design-system/CoreSection.tsx',
]

/**
 * 동결된 기존 부채 — { 파일: 허용 건수 }.
 * 이 숫자는 **오직 내려가기만 한다.** 늘리는 PR은 리뷰에서 거절 대상.
 * 각 항목의 치환 목표 토큰은 04-GUARD.md §7 이관표에 있다.
 */
const BASELINE = {
  'app/components/Common/DDayBadge.tsx': 1,
  'app/components/Common/Investments/InvestmentItem.tsx': 2,
  'app/components/Common/RecordAvatar.tsx': 1,
  'app/components/GoalSections/AddRecordDrawer.tsx': 1,
  'app/components/GoalSections/GoalGroupCard.tsx': 2,
  'app/components/GoalSections/GoalGroupItemRow.tsx': 2,
  'app/components/GoalSections/GoalRow.tsx': 1,
  'app/components/InvestmentDetailSections/PaymentHistoryTable.tsx': 2,
  'app/components/LandingPageSections/HeroSection.tsx': 1,
  'app/components/StatsSections/ArrivalHeroSection.tsx': 2,
  'app/components/StatsSections/CumulativePrincipalChart.tsx': 1,
  'app/components/StatsSections/FulfillmentHeatmapSection.tsx': 1,
  'app/components/StatsSections/GoalPaceSection.tsx': 5,
  'app/components/StatsSections/MonthlyTrendSection.tsx': 1,
  'app/components/StatsSections/SavedMoneyHeroSection.tsx': 1,
  'app/components/StatsSections/StreakHeroSection.tsx': 1,
  'app/components/StatsSections/TiltToggle.tsx': 1,
  'app/components/ToryRaising/ToryRaisingFullScreen.tsx': 1,
  'app/components/design-system/DashboardListRowsPatternSection.tsx': 4,
  'app/utils/recordAvatar.ts': 1,
  'components/ui/calendar.tsx': 2,
}

/** text-[...] 중 '길이 값'만. var()·#hex·calc()는 폰트 크기가 아니므로 제외된다. */
const ARBITRARY_TEXT = /(?<![\w-])text-\[(-?\d*\.?\d+(?:px|rem|em|pt))\]/g
/** 인라인 스타일의 fontSize 리터럴. fontSize: someVar 는 잡지 않는다. */
const INLINE_FONT_SIZE = /\bfontSize\s*:\s*(['"`]?)(\d[\d.]*(?:px|rem|em|pt)?)\1/g

/** px 기준 스케일 토큰. 안내에 '가장 가까운 토큰'을 찍어주려고 쓴다. */
const SCALE = [
  { token: 'text-caption', px: 12 },
  { token: 'text-label', px: 14 },
  { token: 'text-body', px: 16 },
  { token: 'text-heading', px: 20 },
  { token: 'text-title', px: 24 },
  { token: 'text-display', px: 30 },
  { token: 'text-display-lg', px: 36 },
]

function toPx(value) {
  const n = parseFloat(value)
  if (value.endsWith('rem') || value.endsWith('em')) return n * 16
  if (value.endsWith('pt')) return (n * 4) / 3
  return n
}

function nearestToken(value) {
  const px = toPx(value)
  const best = SCALE.reduce((a, b) => (Math.abs(b.px - px) < Math.abs(a.px - px) ? b : a))
  const delta = best.px - px
  const drift = delta === 0 ? '값 동일' : `${px}px → ${best.px}px (${delta > 0 ? '+' : ''}${Math.round(delta * 10) / 10}px 변함 · 눈검증 필요)`
  return `${best.token} — ${drift}`
}

const found = new Map() // file -> [{line, match, text}]

for (const file of collectFiles()) {
  if (isAllowlisted(file, ALLOWLIST)) continue
  const src = readSource(file)
  if (!src) continue
  const disabled = readInlineDisables(src.raw, RULE)

  const hits = []
  const push = (index, match, value) => {
    const line = lineOf(src.masked, index)
    if (disabled.has(line)) return
    hits.push({ file, line, match, fix: nearestToken(value), text: lineTextOf(src.raw, line) })
  }
  for (const m of src.masked.matchAll(ARBITRARY_TEXT)) push(m.index, m[0], m[1])
  for (const m of src.masked.matchAll(INLINE_FONT_SIZE)) {
    push(m.index, m[0], /(px|rem|em|pt)$/.test(m[2]) ? m[2] : `${m[2]}px`)
  }
  if (hits.length > 0) found.set(file, hits)
}

const violations = []
const baselined = []
const shrunk = []

for (const [file, hits] of found) {
  const budget = BASELINE[file] ?? 0
  if (hits.length > budget) {
    violations.push(
      ...hits.map((h) => ({
        ...h,
        fix: budget > 0 ? `${h.fix} · 이 파일 동결치 ${budget}건 → 현재 ${hits.length}건` : h.fix,
      }))
    )
  } else {
    baselined.push(...hits)
    if (hits.length < budget) shrunk.push(`${file}: BASELINE ${budget} → ${hits.length}`)
  }
}

// 동결해 뒀는데 실제로는 사라진 항목 — 목록이 조용히 부풀지 않도록 알린다.
const stale = Object.keys(BASELINE).filter((f) => !found.has(f))

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

if (shrunk.length > 0 || stale.length > 0) {
  console.log('[fontsize] 베이스라인이 실제보다 큽니다 — 스크립트 상단 BASELINE을 낮춰 주세요:')
  for (const s of shrunk) console.log(`  · ${s}`)
  for (const f of stale) console.log(`  · ${f}: 항목 삭제 (남은 위반 없음)`)
  console.log('')
}

report({
  rule: RULE,
  title: `임의 폰트 크기 (text-[Npx] · fontSize 리터럴) — 동결 ${baselined.length}건`,
  violations,
  warnings: baselined,
  hint: '  6단 스케일 토큰만 쓴다: text-caption(12) label(14) body(16) heading(20) title(24) display(30).',
  warnHint:
    '동결된 기존 부채. 치환하면 실제 렌더 크기가 바뀌어 눈검증이 필요하다 → 04-GUARD.md §7 이관표 참고.',
})
