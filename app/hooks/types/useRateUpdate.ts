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
  showToast: boolean
  checkAndUpdate: () => Promise<boolean>
  hideToast: () => void
}
