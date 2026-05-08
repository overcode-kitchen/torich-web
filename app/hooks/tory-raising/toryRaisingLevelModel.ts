export type ToryTitle = {
  emoji: string
  name: string
  minLevel: number
  maxLevel: number | null
}

export type ToryAppearanceStage = {
  stageIndex: number
  minLevel: number
  maxLevel: number | null
}

export type ToryLevelProgress = {
  level: number
  title: ToryTitle
  appearanceStage: ToryAppearanceStage
  nextLevel: number | null
  progressPercent: number
  acornsToNext: number | null
  nextAppearanceStageLevelsRemaining: number | null
}

type LevelThresholds = {
  maxLevel: number
  thresholdsByLevel: number[]
}

const TITLE_TIERS: ToryTitle[] = [
  { emoji: '🌱', name: '새내기 다람쥐', minLevel: 1, maxLevel: 5 },
  { emoji: '🌰', name: '도토리 줍는 다람쥐', minLevel: 6, maxLevel: 15 },
  { emoji: '📈', name: '꾸준한 투자러', minLevel: 16, maxLevel: 30 },
  { emoji: '💰', name: '도토리 사장님', minLevel: 31, maxLevel: 50 },
  { emoji: '🎯', name: '적립의 달인', minLevel: 51, maxLevel: 70 },
  { emoji: '🧙', name: '복리의 현자', minLevel: 71, maxLevel: 99 },
  { emoji: '👑', name: '도토리 황제', minLevel: 100, maxLevel: null },
]

const APPEARANCE_STAGES: ToryAppearanceStage[] = [
  { stageIndex: 1, minLevel: 1, maxLevel: 5 },
  { stageIndex: 2, minLevel: 6, maxLevel: 15 },
  { stageIndex: 3, minLevel: 16, maxLevel: 30 },
  { stageIndex: 4, minLevel: 31, maxLevel: 60 },
  { stageIndex: 5, minLevel: 61, maxLevel: null },
]

/**
 * PRD의 “레벨업 곡선(구간별 누적 도토리 필요량)”을
 * 데모용으로 “구간 내부 선형 분배(올림)”해 레벨별 임계값을 구성합니다.
 *
 * - thresholdsByLevel[i] = totalAcorns가 i레벨이 되기 위한 최소 누적값
 * - level=1은 thresholds[1]=0
 */
function buildLevelThresholds(maxLevel: number): LevelThresholds {
  // (fromLevel -> toLevel) 로 넘어갈 때 추가로 필요한 totalAcorns(=해당 구간 누적)
  const segments: Array<{ from: number; to: number; totalAdditional: number }> = [
    { from: 1, to: 5, totalAdditional: 30 },
    { from: 5, to: 10, totalAdditional: 100 },
    { from: 10, to: 20, totalAdditional: 300 },
    { from: 20, to: 35, totalAdditional: 800 },
    { from: 35, to: 60, totalAdditional: 2000 },
    // PRD: Lv60+ = 5000+ (1년+). 데모에서는 60->100을 5000으로 가정.
    { from: 60, to: 100, totalAdditional: 5000 },
  ]

  const thresholdsByLevel = new Array<number>(maxLevel + 1).fill(0)
  thresholdsByLevel[1] = 0

  let lastLevel = 1
  let lastThreshold = 0

  for (const seg of segments) {
    const from = Math.max(seg.from, lastLevel)
    const steps = Math.max(1, seg.to - from)

    for (let lv = from + 1; lv <= Math.min(seg.to, maxLevel); lv += 1) {
      const stepIndex = lv - from
      const additional = Math.ceil(seg.totalAdditional * (stepIndex / steps))
      thresholdsByLevel[lv] = lastThreshold + additional
      lastLevel = lv
    }

    lastThreshold = thresholdsByLevel[Math.min(seg.to, maxLevel)]
    lastLevel = Math.min(seg.to, maxLevel)
    if (lastLevel >= maxLevel) break
  }

  // maxLevel이 100을 넘어가면, 100->100+는 1레벨당 고정 증가(데모값)로 이어감
  if (maxLevel > 100) {
    const perLevel = 5000 / (100 - 60) // 125
    for (let lv = 101; lv <= maxLevel; lv += 1) {
      thresholdsByLevel[lv] = thresholdsByLevel[lv - 1] + Math.ceil(perLevel)
    }
  }

  return { maxLevel, thresholdsByLevel }
}

const DEFAULT_MAX_LEVEL = 150
const DEFAULT_THRESHOLDS = buildLevelThresholds(DEFAULT_MAX_LEVEL)

export function getTitleForLevel(level: number): ToryTitle {
  const tier = TITLE_TIERS.find((t) => level >= t.minLevel && (t.maxLevel === null || level <= t.maxLevel))
  return tier ?? TITLE_TIERS[TITLE_TIERS.length - 1]
}

export function getAppearanceStageForLevel(level: number): ToryAppearanceStage {
  const stage = APPEARANCE_STAGES.find((s) => level >= s.minLevel && (s.maxLevel === null || level <= s.maxLevel))
  return stage ?? APPEARANCE_STAGES[APPEARANCE_STAGES.length - 1]
}

export function calculateToryLevel(totalAcorns: number, maxLevel = DEFAULT_MAX_LEVEL): number {
  const t = maxLevel === DEFAULT_MAX_LEVEL ? DEFAULT_THRESHOLDS : buildLevelThresholds(maxLevel)

  if (!Number.isFinite(totalAcorns) || totalAcorns <= 0) return 1

  let level = 1
  for (let lv = 1; lv <= t.maxLevel; lv += 1) {
    if (totalAcorns >= t.thresholdsByLevel[lv]) level = lv
  }
  return level
}

export function calculateToryLevelProgress(totalAcorns: number): ToryLevelProgress {
  const level = calculateToryLevel(totalAcorns)
  const title = getTitleForLevel(level)
  const appearanceStage = getAppearanceStageForLevel(level)

  const thresholds = DEFAULT_THRESHOLDS.thresholdsByLevel
  const nextLevel = level >= DEFAULT_MAX_LEVEL ? null : level + 1

  if (nextLevel === null) {
    return {
      level,
      title,
      appearanceStage,
      nextLevel: null,
      progressPercent: 100,
      acornsToNext: null,
      nextAppearanceStageLevelsRemaining: null,
    }
  }

  const fromThreshold = thresholds[level]
  const toThreshold = thresholds[nextLevel]
  const earnedInLevel = Math.max(0, totalAcorns - fromThreshold)
  const neededInLevel = Math.max(1, toThreshold - fromThreshold)
  const progressPercent = Math.min(100, Math.max(0, (earnedInLevel / neededInLevel) * 100))

  const acornsToNext = Math.max(0, toThreshold - totalAcorns)

  const currentStageIndex = appearanceStage.stageIndex
  const nextStage = APPEARANCE_STAGES.find((s) => s.stageIndex === currentStageIndex + 1) ?? null
  const nextAppearanceStageLevelsRemaining =
    nextStage === null ? null : Math.max(0, nextStage.minLevel - level)

  return {
    level,
    title,
    appearanceStage,
    nextLevel,
    progressPercent,
    acornsToNext,
    nextAppearanceStageLevelsRemaining,
  }
}

