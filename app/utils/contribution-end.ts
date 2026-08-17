import type { Investment } from '@/app/types/investment'
import { getRecordEndDate } from './date'

/**
 * "이 적립 항목은 적립이 완전히 끝났는가" 단일 판정.
 *
 * 유형별로 끝나는 방식이 달라 판정이 화면마다 흩어져 있었다(아바타는 아무것도 안 보고,
 * pill은 `settled_at`만 봐서 투자·현금의 기간 만료를 놓쳤다). 아바타·상태 pill·상세가
 * 같은 기준으로 읽히도록 여기 하나로 모은다.
 *
 * | 유형 | 끝나는 시점 |
 * |---|---|
 * | 적금 | 만기 정산(`settled_at`) 또는 만기일 경과 |
 * | 투자 | 종료일(`maturity_date` 또는 시작일 + `period_years`) 경과 |
 * | 현금 | 기간이 있으면 그 종료일 경과, **무기한이면 영원히 끝나지 않는다** |
 *
 * 종료일 판정은 `getRecordEndDate`(만기일 우선 → 시작일 + 기간)를 그대로 쓴다.
 * 통계·도착 예정이 쓰는 `scheduled-contribution.ts`의 `maturityDate()`는 `period_years`만 보고
 * `maturity_date`를 무시한다 — 그쪽은 예정 회차 합산 기준이라 이번 변경 범위에서 건드리지 않았다.
 */
export type ContributionEndInput = Pick<
  Investment,
  'settled_at' | 'maturity_date' | 'period_years' | 'start_date' | 'created_at'
>

/** 날짜 00:00 기준. 종료일 '당일'은 아직 적립 회차가 남아 있으므로 종료로 보지 않는다. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * 적립이 끝났는지 여부.
 * 정산이 끝났으면(`settled_at`) 날짜와 무관하게 끝난 것으로 본다 — 조기 정산도 종료다.
 * 종료일이 없는 항목(무기한 현금 모으기 등)은 항상 false.
 */
export function isContributionEnded(
  record: ContributionEndInput,
  now: Date = new Date(),
): boolean {
  if (record.settled_at) return true
  const end = getRecordEndDate(record)
  if (!end) return false
  if (Number.isNaN(end.getTime())) return false
  return startOfDay(end).getTime() < startOfDay(now).getTime()
}
