export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  target_date: string | null;
  emoji: string | null;
  memo: string | null;
  external_amount: number;
  completed_at: string | null;
  archived_at: string | null;
  notification_enabled: boolean;
  /** 수동 드래그 순서. NULL이면 target_date 폴백 정렬 뒤로. 구버전 앱 호환 위해 nullable. */
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export type GoalCreateInput = Pick<
  Goal,
  | "name"
  | "target_amount"
  | "target_date"
  | "emoji"
  | "memo"
  | "external_amount"
  | "notification_enabled"
>;

export type GoalUpdateInput = Partial<
  Omit<Goal, "id" | "user_id" | "created_at">
>;

export interface GoalProgress {
  goalId: string;
  currentValue: number;
  projectedValue: number | null;
  /**
   * 목표 대비 실제 비율. 100을 넘을 수 있다(초과 달성).
   * 목표 금액이 없는 목적은 진행률을 계산할 수 없어 null.
   * 화면에 그대로 찍지 말 것 — 표시에는 displayPercent를 쓴다.
   */
  progressPercent: number | null;
  /**
   * 화면에 찍는 진행률(0~100). 초과분은 잘라내고, 아직 달성이 아닌데
   * 반올림으로 100%가 되는 경우도 막는다(99.6% → 99%).
   * 초과 금액을 말해야 하는 곳은 currentValue와 target_amount로 직접 계산한다.
   */
  displayPercent: number | null;
  projectedProgressPercent: number | null;
  dDay: number | null;
  isCompleted: boolean;
}
