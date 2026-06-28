'use client'

import type { GroupId } from '@/app/hooks/investment/add/useAddItemFlow'
import StepProgressBar from '@/app/components/Common/StepProgressBar'

interface AddItemHeaderProps {
  /** 현재 그룹 (진행 표시 채움 결정) */
  currentGroup: GroupId
}

const GROUP_ORDER: GroupId[] = ['A', 'B', 'C']

/**
 * 적립항목 추가 3분할 프로그레스 바. 공용 StepProgressBar를 사용한다.
 * ← 뒤로가기 버튼은 SubPageScaffold가 담당하므로 여기서는 그리지 않는다.
 */
export default function AddItemHeader({ currentGroup }: AddItemHeaderProps) {
  return (
    <StepProgressBar
      current={GROUP_ORDER.indexOf(currentGroup) + 1}
      total={GROUP_ORDER.length}
    />
  )
}
