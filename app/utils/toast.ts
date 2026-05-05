import { toast as sonnerToast } from 'sonner'

/** 에러/안내 토스트용 공통 메시지 */
export const TOAST_MESSAGES = {
  /** 로드 실패 (목록, 통계 등) */
  loadFailed: '잠시 후 다시 시도해 주세요.',
  /** 투자 목록 로드 실패 */
  investmentListLoadFailed: '투자 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  /** 통계 데이터 로드 실패 */
  statsLoadFailed: '통계 데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  /** 설정 로드 실패 */
  settingsLoadFailed: '설정을 불러오지 못했어요.',
  /** 납입 기록 로드 실패 */
  paymentHistoryLoadFailed: '납입 기록을 불러오지 못했어요.',
  /** 저장 실패 (공통) */
  saveFailed: '설정 저장에 실패했어요. 다시 시도해 주세요.',
  /** 알림 설정 저장 실패 */
  notificationSettingsSaveFailed: '알림 설정 저장에 실패했어요. 다시 시도해 주세요.',
  /** 납입 반영 실패 */
  paymentToggleFailed: '납입 반영에 실패했어요. 다시 시도해 주세요.',
  /** 삭제 실패 */
  deleteFailed: '삭제에 실패했어요. 다시 시도해 주세요.',
  /** 수정 저장 실패 */
  updateSaveFailed: '수정 사항을 저장하지 못했어요. 다시 시도해 주세요.',
  /** 데이터 로드 실패 (일반) */
  dataLoadFailed: '데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  /** 네트워크 오류 */
  networkError: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
  /** 시스템 수익률 자동 갱신 실패 (홈 진입·update-user-rates) */
  rateUpdateFailed: '수익률 갱신에 실패했어요. 잠시 후 다시 시도해 주세요.',
  /** 매수 ✓ 시 시세 캡처 실패 (✓ 자체는 성공, captured_price=NULL) */
  priceCaptureFailed: '시세를 못 받아서 이번 매수의 금액 추정이 안 됐어요. 통계에서 다시 가져올 수 있어요.',
} as const

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()
  return (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('net::') ||
    lower.includes('timeout')
  )
}

/**
 * 에러 발생 시 상황에 맞는 메시지로 토스트 표시.
 * 네트워크 오류면 TOAST_MESSAGES.networkError, 아니면 전달한 메시지 사용.
 */
export function showErrorToast(message: string, error?: unknown): void {
  const finalMessage = error !== undefined && isNetworkError(error)
    ? TOAST_MESSAGES.networkError
    : message
  sonnerToast.error(finalMessage)
}

/**
 * 에러 메시지 상수로 토스트 표시 (네트워크 여부는 호출 측에서 판단해 message 선택 가능).
 */
export function toastError(message: string): void {
  sonnerToast.error(message)
}

export function toastSuccess(message: string): void {
  sonnerToast.success(message)
}
