import { shortWon } from '@/app/utils/goal-format'
import { monthIndex, toYearMonth } from '@/app/utils/scheduled-contribution'
import type { GoalArrival } from '@/app/utils/goal-arrival'

/**
 * 도착 예정 문구.
 *
 * 톤 규칙: `늦게 도착해요`처럼 판정하지 않고 `월 N원이면 맞춰져요`처럼 산수로 안내한다.
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

/** 올해면 `9월`, 아니면 `2027년 9월` — 해가 다를 때 달만 말하면 언제인지 알 수 없다 */
function monthLabelWithYear(date: Date, today: Date): string {
  const month = date.getMonth() + 1
  return date.getFullYear() === today.getFullYear() ? `${month}월` : `${date.getFullYear()}년 ${month}월`
}

function behindLabel(arrival: GoalArrival): string {
  // 미룸 버튼으로 명시적으로 미룬 회차만 있을 때만 '미룬'이라고 부른다
  const noun = arrival.postponedCount === arrival.behindCount ? '미룬' : '밀린'
  return `${noun} ${arrival.behindCount}회`
}

/** 지금 이 목적에 얼마가 들어가고 있는지 — hero 마지막 줄의 앞부분 */
function contributionPhrase(arrival: GoalArrival): string {
  if (arrival.monthlyContribution <= 0) return '이 목적에 아직 월 적립이 없어요'
  return `이 목적에 월 ${shortWon(arrival.monthlyContribution)} 넣는 중`
}

/**
 * 원인별 다음 행동 — 원인이 셋이고 각각 할 일이 다르므로 문구를 나눈다.
 * (①설정 불일치 → 더 넣기 / ②미룸·누락 → 채우기 / ③적립 종료 → 이어가기)
 */
function arrivalActionPhrase(arrival: GoalArrival, today: Date = new Date()): string {
  const nowIndex = monthIndex(toYearMonth(today))
  const targetIndex = monthIndex(toYearMonth(new Date(arrival.goal.target_date)))

  // 목표일이 이미 지난 목적에 "월 N원을 더하면 맞춰져요"는 성립하지 않는다 → 남은 금액으로 안내
  if (targetIndex < nowIndex) {
    return arrival.shortfall > 0
      ? `목표일이 지났어요. ${shortWon(arrival.shortfall)}을 더 모으면 도착해요`
      : '목표일이 지났어요'
  }

  // 정산·만기로 적립이 끝난 목적은 월 적립액이 0이 된다. 이때 "적립을 등록하세요"만 말하면
  // 왜 도착 시점이 사라졌는지가 빠지므로, 끊긴 시점을 먼저 알린다.
  if (arrival.reason !== 'period_end' && arrival.monthlyContribution <= 0 && !arrival.arrivalDate) {
    return '월 적립을 등록하면 도착 시점을 알려드려요'
  }

  switch (arrival.reason) {
    case 'on_track': {
      const arrivalIndex = arrival.arrivalDate
        ? monthIndex(toYearMonth(arrival.arrivalDate))
        : targetIndex
      return arrivalIndex < targetIndex ? '목표일보다 빨라요' : '목표일에 맞춰 도착해요'
    }
    case 'config_gap':
      return `월 ${shortWon(arrival.extraMonthly)}을 더하면 목표일에 맞춰져요`
    case 'postponed':
      return `${behindLabel(arrival)}를 채우면 목표일에 맞춰져요`
    case 'period_end': {
      if (!arrival.fundingEndDate) return '적립을 이어가면 목표일에 맞춰져요'
      const label = monthLabelWithYear(arrival.fundingEndDate, today)
      return arrival.fundingEndDate.getTime() < today.getTime()
        ? `이 적립은 ${label}에 끝났어요. 이어가면 목표일에 맞춰져요`
        : `이 적립은 ${label}에 끝나요. 이후를 이어가면 목표일에 맞춰져요`
    }
  }
}

/** hero 마지막 줄 — 지금 상태(월 적립액)와 다음 행동을 한 줄에 잇는다 */
export function arrivalHeroLine(arrival: GoalArrival, today: Date = new Date()): string {
  return `${contributionPhrase(arrival)} — ${arrivalActionPhrase(arrival, today)}`
}
