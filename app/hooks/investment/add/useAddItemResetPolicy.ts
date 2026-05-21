'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import type { RecordType } from '@/app/types/investment'
import type { UseAddItemFlowReturn } from './useAddItemFlow'
import type { UseAddItemFormStateReturn } from './useAddItemFormState'

export interface UseAddItemResetPolicyProps {
  recordType: RecordType
  formState: UseAddItemFormStateReturn
  flow: UseAddItemFlowReturn
  /** 투자 전용 state 리셋 콜백 (stockName/period 등). 투자에서만 필요. */
  resetInvestmentSpecific?: () => void
  /** 편집 모드면 type 변경 자체가 허용되지 않으므로 정책 비활성. */
  isEditMode?: boolean
}

const RESET_TOAST_MESSAGE = '유형을 바꾸면 이전에 입력한 내용을 다시 입력해야 해요'

/**
 * 적립 항목 추가 플로우의 리셋 정책 hook.
 * - 그룹 A 내부에서 recordType 변경 → A의 후속 입력만 자동 리셋 (다음 step에서 visible해지면 빈 값)
 * - 그룹 B/C 진입 후 ← 로 A로 복귀하여 recordType 변경 → 공통/투자 전용 state 모두 폐기 + 토스트 노출 + 그룹 A로 리셋
 *
 * 두 케이스 모두 recordType 변경 시점에 발동되며, 그 직전의 currentGroup으로 분기를 결정한다.
 */
export function useAddItemResetPolicy({
  recordType,
  formState,
  flow,
  resetInvestmentSpecific,
  isEditMode = false,
}: UseAddItemResetPolicyProps): void {
  const prevTypeRef = useRef<RecordType>(recordType)

  useEffect(() => {
    if (isEditMode) {
      prevTypeRef.current = recordType
      return
    }
    const prev = prevTypeRef.current
    if (prev === recordType) return

    // 그룹 A에 있을 때: A 내부 변경 → 후속 필드만 자동으로 리셋되므로 토스트 없음.
    //   - flow의 visibleFieldIds는 currentFieldIndex에 따라 결정되며,
    //   - recordType 변경 후 새 sequence가 적용되면 후속 필드는 아직 노출되지 않은 상태로 시작한다.
    //   - 공통 state(title 등)는 사용자가 다시 입력하지만, 이전 값을 폐기할지는 정책에 따라 다름.
    // 그룹 B/C에 있을 때: 이전에 입력한 B/C 데이터를 폐기하고 그룹 A로 되돌림 + 경고 토스트.
    if (flow.currentGroup === 'B' || flow.currentGroup === 'C') {
      formState.resetAll()
      resetInvestmentSpecific?.()
      flow.goToGroup('A')
      toast(RESET_TOAST_MESSAGE)
    } else {
      // 그룹 A 내부 변경: 공통 state도 깨끗하게 초기화 (이전 type의 입력값 유지하지 않음)
      formState.resetAll()
      resetInvestmentSpecific?.()
    }

    prevTypeRef.current = recordType
    // 의존성: recordType만 트리거. 다른 hook은 stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordType])
}
