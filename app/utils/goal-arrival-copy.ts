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
