'use client'

import { useCallback, useMemo, useState } from 'react'
import type { RecordType } from '@/app/types/investment'

export type GroupId = 'A' | 'B' | 'C'

/** record_type별 그룹/필드 시퀀스. progressive disclosure 순서대로. */
export const FIELD_SEQUENCES: Record<RecordType, Record<GroupId, string[]>> = {
  investment: {
    A: ['recordType', 'market', 'stockName'],
    B: ['monthlyAmount', 'period'],
    C: ['startDate', 'investmentDays'],
  },
  savings: {
    A: ['recordType', 'title'],
    B: ['monthlyAmount', 'interestRate', 'maturityDate'],
    C: ['investmentDays'],
  },
  cash: {
    A: ['recordType', 'title'],
    B: ['monthlyAmount'],
    C: ['investmentDays'],
  },
}

export interface UseAddItemFlowProps {
  recordType: RecordType
  /** editId가 있으면 편집 모드. initialField로 즉시 진입. */
  editId?: string | null
  initialField?: string | null
}

export interface UseAddItemFlowReturn {
  currentGroup: GroupId
  currentFieldIndex: number
  fieldsInCurrentGroup: string[]
  visibleFieldIds: string[]
  isAtFirstField: boolean
  isAtLastField: boolean
  progress: number
  goNext: () => void
  goBack: () => void
  goToGroup: (group: GroupId, fieldId?: string) => void
  resetFromGroup: (group: GroupId) => void
}

/**
 * 적립 항목 추가/편집 플로우의 step state 관리 hook.
 * - record_type별 그룹/필드 시퀀스를 따라 progressive disclosure 진행
 * - editId+initialField로 특정 필드 즉시 진입(편집 모드)
 * - goNext()는 iOS 키보드 잔류 방지를 위해 document.activeElement.blur() 호출
 */
export function useAddItemFlow({
  recordType,
  editId,
  initialField,
}: UseAddItemFlowProps): UseAddItemFlowReturn {
  const sequences = FIELD_SEQUENCES[recordType]

  // 편집 모드: initialField가 속한 그룹/인덱스로 즉시 진입
  const initialPosition = useMemo<{ group: GroupId; index: number }>(() => {
    if (editId && initialField) {
      for (const g of ['A', 'B', 'C'] as GroupId[]) {
        const idx = FIELD_SEQUENCES[recordType][g].indexOf(initialField)
        if (idx >= 0) return { group: g, index: idx }
      }
    }
    return { group: 'A', index: 0 }
  }, [editId, initialField, recordType])

  const [currentGroup, setCurrentGroup] = useState<GroupId>(initialPosition.group)
  const [currentFieldIndex, setCurrentFieldIndex] = useState<number>(initialPosition.index)

  const fieldsInCurrentGroup = sequences[currentGroup]
  const visibleFieldIds = fieldsInCurrentGroup.slice(0, currentFieldIndex + 1)
  const isAtFirstField = currentGroup === 'A' && currentFieldIndex === 0
  const isAtLastField =
    currentGroup === 'C' && currentFieldIndex === sequences.C.length - 1
  const progress =
    currentGroup === 'A' ? 1 / 3 : currentGroup === 'B' ? 2 / 3 : 1

  const dismissKeyboard = useCallback((): void => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }, [])

  const goNext = useCallback((): void => {
    dismissKeyboard()
    const lastIndex = sequences[currentGroup].length - 1
    if (currentFieldIndex < lastIndex) {
      setCurrentFieldIndex(currentFieldIndex + 1)
      return
    }
    if (currentGroup === 'A') {
      setCurrentGroup('B')
      setCurrentFieldIndex(0)
    } else if (currentGroup === 'B') {
      setCurrentGroup('C')
      setCurrentFieldIndex(0)
    }
  }, [currentGroup, currentFieldIndex, sequences, dismissKeyboard])

  const goBack = useCallback((): void => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1)
      return
    }
    if (currentGroup === 'B') {
      setCurrentGroup('A')
      setCurrentFieldIndex(sequences.A.length - 1)
    } else if (currentGroup === 'C') {
      setCurrentGroup('B')
      setCurrentFieldIndex(sequences.B.length - 1)
    }
  }, [currentGroup, currentFieldIndex, sequences])

  const goToGroup = useCallback(
    (group: GroupId, fieldId?: string): void => {
      setCurrentGroup(group)
      const idx = fieldId ? sequences[group].indexOf(fieldId) : 0
      setCurrentFieldIndex(idx >= 0 ? idx : 0)
    },
    [sequences],
  )

  const resetFromGroup = useCallback((group: GroupId): void => {
    setCurrentGroup(group)
    setCurrentFieldIndex(0)
  }, [])

  return {
    currentGroup,
    currentFieldIndex,
    fieldsInCurrentGroup,
    visibleFieldIds,
    isAtFirstField,
    isAtLastField,
    progress,
    goNext,
    goBack,
    goToGroup,
    resetFromGroup,
  }
}
