'use client'

import { useCallback, useMemo, useState } from 'react'

export type GroupId = 'A' | 'B' | 'C'

/**
 * 편집 모드에서 ?field=XXX 으로 진입한 필드가 속한 그룹을 결정하는 매핑.
 * (SavingsCashDetailView에서 정보 행 탭 → /add?editId=&field= 진입 시 사용)
 */
const FIELD_TO_GROUP: Record<string, GroupId> = {
  recordType: 'A',
  market: 'A',
  stockName: 'A',
  title: 'A',
  monthlyAmount: 'B',
  period: 'B',
  interestRate: 'B',
  maturityDate: 'B',
  startDate: 'C',
  investmentDays: 'C',
}

const GROUP_ORDER: GroupId[] = ['A', 'B', 'C']

export interface UseAddItemFlowProps {
  /** editId가 있고 initialField가 주어지면 해당 필드 그룹으로 즉시 진입 */
  editId?: string | null
  initialField?: string | null
}

export interface UseAddItemFlowReturn {
  currentGroup: GroupId
  isAtFirstGroup: boolean
  isAtLastGroup: boolean
  progress: number
  /**
   * 단일 필드 편집 모드 — editId + 유효한 field= 로 진입한 경우.
   * 상세의 정보 행을 탭해 그 필드만 고치러 온 것이므로, 그룹을 끝까지 넘기지 않고
   * 바로 저장하고 원래 화면으로 돌아간다.
   */
  isSingleFieldMode: boolean
  /** 진입 필드 키. 단일 필드 모드가 아니면 null. */
  entryField: string | null
  goNextGroup: () => void
  goPrevGroup: () => void
  goToGroup: (group: GroupId) => void
}

/**
 * 적립 항목 추가/편집 플로우의 그룹 단위 step state hook.
 * - 그룹 내 필드는 각 Group 컴포넌트가 입력값 충족 여부로 자체 노출 (자동 progressive disclosure)
 * - 다음/저장 버튼은 그룹 경계 전환과 최종 제출에만 사용
 * - 그룹 전환 시 iOS 키보드 잔류 방지를 위해 document.activeElement.blur() 호출
 */
export function useAddItemFlow({
  editId,
  initialField,
}: UseAddItemFlowProps): UseAddItemFlowReturn {
  // 진입 필드가 유효할 때만 단일 필드 모드로 본다. (메뉴 → "수정하기"는 field가 없어 전체 편집)
  const entryField = useMemo<string | null>(
    () => (editId && initialField && FIELD_TO_GROUP[initialField] ? initialField : null),
    [editId, initialField],
  )
  const isSingleFieldMode = entryField !== null

  const initialGroup = useMemo<GroupId>(
    () => (entryField ? FIELD_TO_GROUP[entryField] : 'A'),
    [entryField],
  )

  const [currentGroup, setCurrentGroup] = useState<GroupId>(initialGroup)

  const dismissKeyboard = useCallback((): void => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }, [])

  const goNextGroup = useCallback((): void => {
    dismissKeyboard()
    const idx = GROUP_ORDER.indexOf(currentGroup)
    if (idx < GROUP_ORDER.length - 1) setCurrentGroup(GROUP_ORDER[idx + 1])
  }, [currentGroup, dismissKeyboard])

  const goPrevGroup = useCallback((): void => {
    const idx = GROUP_ORDER.indexOf(currentGroup)
    if (idx > 0) setCurrentGroup(GROUP_ORDER[idx - 1])
  }, [currentGroup])

  const goToGroup = useCallback((g: GroupId): void => setCurrentGroup(g), [])

  const isAtFirstGroup = currentGroup === 'A'
  const isAtLastGroup = currentGroup === 'C'
  const progress =
    currentGroup === 'A' ? 1 / 3 : currentGroup === 'B' ? 2 / 3 : 1

  return {
    currentGroup,
    isAtFirstGroup,
    isAtLastGroup,
    progress,
    isSingleFieldMode,
    entryField,
    goNextGroup,
    goPrevGroup,
    goToGroup,
  }
}
