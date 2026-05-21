'use client'

import type { GroupId } from '@/app/hooks/investment/add/useAddItemFlow'

interface AddItemHeaderProps {
  /** 현재 그룹 (진행 표시 채움 결정) */
  currentGroup: GroupId
}

/**
 * 토스 스타일 3분할 프로그레스 바.
 * - 현재 그룹과 그 이전 그룹은 채워짐, 이후 그룹은 비어 있음
 * - 그룹 A=1/3, B=2/3, C=3/3
 *
 * ← 뒤로가기 버튼은 SubPageScaffold가 담당하므로 여기서는 그리지 않는다.
 */
export default function AddItemHeader({ currentGroup }: AddItemHeaderProps) {
  const isFilled = (g: GroupId): boolean => {
    if (currentGroup === 'A') return g === 'A'
    if (currentGroup === 'B') return g === 'A' || g === 'B'
    return true
  }

  return (
    <div className="flex items-center gap-2 mb-8" role="progressbar" aria-label="진행 단계">
      {(['A', 'B', 'C'] as GroupId[]).map((g) => (
        <div
          key={g}
          className={
            'h-1 flex-1 rounded-full transition-colors ' +
            (isFilled(g) ? 'bg-foreground' : 'bg-muted')
          }
        />
      ))}
    </div>
  )
}
