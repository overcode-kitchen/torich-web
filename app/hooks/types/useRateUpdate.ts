export type CheckResponse = {
  needsUpdate?: boolean
}

export type UpdateResponse = {
  success?: boolean
  updated?: boolean
  updatedRecords?: number
}

export type UseRateUpdateOptions = {
  onUpdateComplete?: () => void | Promise<void>
}

export type UseRateUpdateReturn = {
  isUpdating: boolean
  /** 홈 진입 시 자동으로 도는 백그라운드 수익률 갱신. signal로 언마운트 시 취소 가능. */
  checkAndUpdate: (signal?: AbortSignal) => Promise<boolean>
}
