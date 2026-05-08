export interface GoalPreset {
  name: string
  emoji: string
}

export const GOAL_PRESETS: GoalPreset[] = [
  { name: '결혼 자금', emoji: '💍' },
  { name: '주택 자금', emoji: '🏠' },
  { name: '여행', emoji: '✈️' },
  { name: '차', emoji: '🚗' },
  { name: '이사', emoji: '📦' },
]

export const GOAL_PRESET_NAMES: string[] = GOAL_PRESETS.map((p) => p.name)
