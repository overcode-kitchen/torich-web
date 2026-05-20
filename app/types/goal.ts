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
  /** 목표 금액이 없는 목적은 진행률을 계산할 수 없어 null. */
  progressPercent: number | null;
  projectedProgressPercent: number | null;
  dDay: number | null;
  isCompleted: boolean;
}
