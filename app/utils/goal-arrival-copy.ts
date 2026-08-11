import { shortWon } from '@/app/utils/goal-format'
import { monthIndex, toYearMonth } from '@/app/utils/scheduled-contribution'
import type { GoalArrival } from '@/app/utils/goal-arrival'

/**
 * 달성 예정 문구.
 *
 * 톤 규칙: `늦게 달성해요`처럼 판정하지 않고 `월 N원이면 맞춰져요`처럼 산수로 안내한다.
 * 목표별 페이스가 지켜온 "판정하지 않고 값을 보여준다"를 문장에서도 유지하기 위함이다.
 */

/** 2027년 3월 */
export function arrivalMonthLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

/** 2027.01 — 목표일처럼 보조로 놓는 자리에 쓴다 */
export function targetMonthLabel(targetDate: string): string {
  const date = new Date(targetDate)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * 1년 안쪽이면 `9월`, 그보다 멀면 `2027년 9월`.
 * 가까운 달은 해를 붙이지 않아도 헷갈리지 않고, 한 줄에 들어가는 길이를 지킬 수 있다.
 */
function monthLabelWithYear(date: Date, today: Date): string {
  const month = date.getMonth() + 1
  const ahead = monthIndex(toYearMonth(date)) - monthIndex(toYearMonth(today))
  return ahead >= 0 && ahead < 12 ? `${month}월` : `${date.getFullYear()}년 ${month}월`
}

function behindLabel(arrival: GoalArrival): string {
  // 미룸 버튼으로 명시적으로 미룬 회차만 있을 때만 '미룬'이라고 부른다
  const noun = arrival.postponedCount === arrival.behindCount ? '미룬' : '밀린'
  return `${noun} ${arrival.behindCount}회`
}

/** 지금 이 목적에 매달 들어가는 금액 — 문장이 아니라 값 하나로 보여준다 */
export function monthlyContributionValue(arrival: GoalArrival): string {
  return arrival.monthlyContribution > 0 ? shortWon(arrival.monthlyContribution) : '없음'
}

/**
 * 원인별 다음 행동 — 원인이 셋이고 각각 할 일이 다르므로 문구를 나눈다.
 * (①설정 불일치 → 더 넣기 / ②미룸·누락 → 채우기 / ③적립 종료 → 이어가기)
 *
 * 카드 폭에서 한 줄을 넘기지 않도록 짧게 쓴다 — 두 줄로 접히면 카드의 마지막 한 줄이라는
 * 위계가 무너지고, 위의 값들과 같은 무게로 읽힌다.
 */
export function arrivalActionPhrase(arrival: GoalArrival, today: Date = new Date()): string {
  const nowIndex = monthIndex(toYearMonth(today))
  const targetIndex = monthIndex(toYearMonth(new Date(arrival.goal.target_date)))

  // 목표일이 이미 지난 목적에 "월 N원 더하면 맞춰져요"는 성립하지 않는다 → 남은 금액으로 안내
  if (targetIndex < nowIndex) {
    return arrival.shortfall > 0
      ? `목표일 지남 · ${shortWon(arrival.shortfall)} 남았어요`
      : '목표일이 지났어요'
  }

  // 정산·만기로 적립이 끝난 목적은 월 적립액이 0이 된다. 이때 "적립을 등록하세요"만 말하면
  // 왜 도착 시점이 사라졌는지가 빠지므로, 끊긴 시점을 먼저 알린다.
  if (arrival.reason !== 'period_end' && arrival.monthlyContribution <= 0 && !arrival.arrivalDate) {
    return '월 적립을 등록하면 알려드려요'
  }

  switch (arrival.reason) {
    case 'on_track': {
      const arrivalIndex = arrival.arrivalDate
        ? monthIndex(toYearMonth(arrival.arrivalDate))
        : targetIndex
      return arrivalIndex < targetIndex ? '목표일보다 빨라요' : '목표일에 맞춰 달성해요'
    }
    case 'config_gap':
      return `월 ${shortWon(arrival.extraMonthly)} 더하면 목표일에 맞춰져요`
    case 'postponed':
      return `${behindLabel(arrival)} 채우면 목표일에 맞춰져요`
    case 'period_end': {
      if (!arrival.fundingEndDate) return '적립을 이어가면 목표일에 맞춰져요'
      const label = monthLabelWithYear(arrival.fundingEndDate, today)
      return `${label} 적립 종료 · 이어가면 맞춰져요`
    }
  }
}

/** hero 회전 문구는 두 줄까지 — 세 줄이면 한 바퀴가 길어져 첫 줄로 언제 돌아오는지 감이 안 온다 */
const MAX_INSIGHT_LINES = 2

/**
 * hero 마지막 줄에서 번갈아 돌릴 문구들 — "얼마 부족한가 → 그래서 뭘 하면 되나".
 *
 * 한 줄에 다 넣으면 접히고, 여러 줄로 쌓으면 카드가 값 표시판이 되므로 회전으로 나눠 보여준다.
 * 위의 값 4개(모은 금액·목표일·월 적립·남은 금액)와 같은 수치를 반복하지 않는 것이 규칙이다.
 * shortfall은 '남은 금액'과 다른 수치다 — 목표일까지 이대로 넣었을 때 그래도 비는 금액이다.
 *
 * 후보를 우선순위 순으로 쌓고 앞에서 두 개만 취한다 — 목적 상태에 따라 성립하는 문구가 달라서,
 * 자리를 고정해두면 어떤 목적에서는 빈 줄이 돌게 된다.
 */
export function arrivalInsightLines(arrival: GoalArrival, today: Date = new Date()): string[] {
  const { goal, progress, shortfall, monthlyContribution } = arrival
  const remaining = Math.max(0, goal.target_amount - progress.currentValue)
  const targetPassed =
    monthIndex(toYearMonth(new Date(goal.target_date))) < monthIndex(toYearMonth(today))

  const lines: string[] = []

  // 목표일이 지난 목적에 "목표일까지 부족해요"는 성립하지 않는다 — 그 안내는 액션 문구가 맡는다
  if (shortfall > 0 && !targetPassed) {
    lines.push(`목표일까지 ${shortWon(shortfall)} 부족해요`)
  }

  lines.push(arrivalActionPhrase(arrival, today))

  if (monthlyContribution > 0 && remaining > 0) {
    lines.push(
      `월 ${shortWon(monthlyContribution)}씩 ${Math.ceil(remaining / monthlyContribution)}번이면 채워져요`
    )
  }

  // 원인 조합에 따라 같은 말이 두 번 들어갈 수 있어 중복을 걷어낸다
  return Array.from(new Set(lines)).slice(0, MAX_INSIGHT_LINES)
}
