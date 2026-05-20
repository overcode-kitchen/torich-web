'use client'

import { useState } from 'react'
import type { RecordType } from '@/app/types/investment'

export interface UseRecordTypeSelectionReturn {
  recordType: RecordType
  setRecordType: (type: RecordType) => void
}

/**
 * /add 화면 최상단 유형 선택(세그먼트 컨트롤) 상태 훅.
 * 기본값은 '투자'.
 */
export function useRecordTypeSelection(): UseRecordTypeSelectionReturn {
  const [recordType, setRecordType] = useState<RecordType>('investment')
  return { recordType, setRecordType }
}
