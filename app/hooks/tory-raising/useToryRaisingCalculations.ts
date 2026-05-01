import { useMemo } from 'react'
import {
  calculateToryLevelProgress,
  type ToryLevelProgress,
  type ToryTitle,
  type ToryAppearanceStage,
  calculateToryLevel,
  getTitleForLevel,
  getAppearanceStageForLevel,
} from './toryRaisingLevelModel'

export type { ToryLevelProgress, ToryTitle, ToryAppearanceStage } from './toryRaisingLevelModel'

export { calculateToryLevel, getTitleForLevel, getAppearanceStageForLevel, calculateToryLevelProgress } from './toryRaisingLevelModel'

export function useToryRaisingCalculations(totalAcorns: number): ToryLevelProgress {
  return useMemo(() => calculateToryLevelProgress(totalAcorns), [totalAcorns])
}

