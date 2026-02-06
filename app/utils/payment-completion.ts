const STORAGE_PREFIX = 'torich_completed_'

export function getPaymentCompletedKey(
  investmentId: string,
  year: number,
  month: number,
  day: number
): string {
  const yearMonth = `${year}-${String(month).padStart(2, '0')}` 
  return `${STORAGE_PREFIX}${investmentId}_${yearMonth}_${day}` 
}

export function setPaymentCompleted(
  investmentId: string,
  year: number,
  month: number,
  day: number
): void {
  if (typeof window === 'undefined') return
  const key = getPaymentCompletedKey(investmentId, year, month, day)
  localStorage.setItem(key, new Date().toISOString())
}

export function clearPaymentCompleted(
  investmentId: string,
  year: number,
  month: number,
  day: number
): void {
  if (typeof window === 'undefined') return
  const key = getPaymentCompletedKey(investmentId, year, month, day)
  localStorage.removeItem(key)
}

export function isPaymentCompleted(
  investmentId: string,
  year: number,
  month: number,
  day: number
): boolean {
  if (typeof window === 'undefined') return false
  const key = getPaymentCompletedKey(investmentId, year, month, day)
  return localStorage.getItem(key) !== null
}
