import type { Investment } from '@/app/types/investment'
import type { Goal } from '@/app/types/goal'
import type { PaymentHistoryMap } from '@/app/types/payment'
import type { PostponedPaymentsMap } from '@/app/hooks/payment/usePostponedPayments'
import { countMonthCompletion } from '@/app/utils/stats'

export const UNASSIGNED_ROW_KEY = '__unassigned__'

export interface HeatmapCell {
  yearMonth: string
  /** 축 라벨용 월 숫자 (1~12) */
  month: number
  total: number
  completed: number
  rate: number
  /** 예정된 회차가 전부 미룸 — '빠뜨림'과 다르게 읽혀야 해 점선으로 구분한다 */
  postponed: boolean
  /** 애초에 납입 예정이 없던 달 */
  scheduled: boolean
}

export interface HeatmapRow {
  key: string
  label: string
  emoji: string | null
  cells: HeatmapCell[]
}

export interface FulfillmentHeatmap {
  rows: HeatmapRow[]
  /** 열 머리글로 쓸 월 숫자 (오래된 달 → 최신 달) */
  months: number[]
  /** 납입 예정이 한 건이라도 있던 달 수 — 히트맵을 그릴 만한지 판단에 쓴다 */
  activeMonthCount: number
}

/**
 * 이행 히트맵(목적 × 최근 N개월) 데이터.
 *
 * 행은 목적, 열은 달, 셀은 그 달 그 목적의 완료율이다. 글자 없이 12개월치를 한눈에 보여
 * "빠뜨리지 않았나"에 답하는 것이 목적이라, 판정 문구는 만들지 않고 농도만 돌려준다.
 *
 * 완료 판정은 월별 막대 차트와 같은 countMonthCompletion을 쓴다 — 같은 정보의 다른 표현이
 * 서로 다른 숫자를 말하지 않게.
 *
 * 정렬은 목표 탭과 같은 마감 임박순(target_date 오름차순, 기한 없으면 뒤). '목적 미지정'은
 * 홈 GoalGroupSection과 같이 항상 마지막에 둔다.
 */
export function buildFulfillmentHeatmap(
  records: Investment[],
  goals: Goal[],
  completedPayments: PaymentHistoryMap,
  retroactivePayments: PaymentHistoryMap,
  postponedPayments: PostponedPaymentsMap,
  monthCount = 12,
  today: Date = new Date()
): FulfillmentHeatmap {
  // 오래된 달 → 최신 달 (히트맵은 왼쪽이 과거)
  const timeline = Array.from({ length: monthCount }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (monthCount - 1 - i), 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })

  const goalById = new Map(goals.map((g) => [g.id, g]))
  const byGoal = new Map<string, Investment[]>()
  for (const r of records) {
    // 보관된 목적에 묶인 기록도 이력은 남아 있으므로 버리지 않고 '목적 미지정'으로 모은다
    const key = r.goal_id && goalById.has(r.goal_id) ? r.goal_id : UNASSIGNED_ROW_KEY
    const list = byGoal.get(key)
    if (list) list.push(r)
    else byGoal.set(key, [r])
  }

  const orderedGoals = [...goals].sort((a, b) => {
    if (a.target_date && b.target_date) {
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    }
    if (a.target_date) return -1
    if (b.target_date) return 1
    return 0
  })

  const groups: Array<{ key: string; label: string; emoji: string | null; records: Investment[] }> = []
  for (const g of orderedGoals) {
    const list = byGoal.get(g.id)
    if (!list || list.length === 0) continue
    groups.push({ key: g.id, label: g.name, emoji: g.emoji, records: list })
  }
  const unassigned = byGoal.get(UNASSIGNED_ROW_KEY)
  if (unassigned && unassigned.length > 0) {
    groups.push({ key: UNASSIGNED_ROW_KEY, label: '목적 미지정', emoji: null, records: unassigned })
  }

  const activeMonths = new Set<string>()
  const rows: HeatmapRow[] = groups.map((group) => ({
    key: group.key,
    label: group.label,
    emoji: group.emoji,
    cells: timeline.map(({ year, month }) => {
      const { total, completed, postponedRecords } = countMonthCompletion(
        group.records,
        completedPayments,
        year,
        month,
        postponedPayments,
        retroactivePayments
      )
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`
      if (total > 0) activeMonths.add(yearMonth)
      return {
        yearMonth,
        month,
        total,
        completed,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        postponed: total === 0 && postponedRecords > 0,
        scheduled: total > 0 || postponedRecords > 0,
      }
    }),
  }))

  return {
    rows,
    months: timeline.map((t) => t.month),
    activeMonthCount: activeMonths.size,
  }
}
