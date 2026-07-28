'use client'

import { CaretRight } from '@phosphor-icons/react'
import { InvestmentField } from '@/app/components/Common/InvestmentField'

interface TappableFieldProps {
  label: string
  /** 값 표시. 값이 없는 자리를 안내 칩으로 채우는 경우가 있어 ReactNode를 받는다(중첩 button 금지 — 아래 주석). */
  value: string | React.ReactNode
  /** 탭 핸들러. 미지정 시 정적(비탭) 행으로 렌더된다. */
  onTap?: () => void
}

/** 탭 가능 여부와 무관하게 같은 행 틀을 쓴다 — 한 섹션에 섞여도 높이·좌우 여백이 어긋나지 않는다. */
const ROW_CLASS =
  'flex w-full items-center gap-2 text-left rounded-lg -mx-2 px-2 min-h-[44px]'

/**
 * 상세 화면의 "탭하면 그 필드 편집으로 들어가는" 정보 행.
 * onTap이 있으면 44px 터치 영역 + 우측 셰브런(>)을 갖춘 button으로, 없으면 같은 틀의 정적 행으로 렌더된다.
 * 예적금·현금(SavingsCashInfoSection)·투자(InfoSection)·목적(GoalInfoSection) 상세가 공유한다.
 * (이슈 #72 — 탭 편집 규약 통일)
 *
 * 정적 행도 셰브런 자리를 빈 칸으로 남긴다. 목적 상세처럼 탭 가능한 행과 계산값 행이 한 목록에
 * 섞이면, 셰브런 폭만큼 값의 오른쪽 끝이 어긋나 레이아웃이 깨져 보이기 때문이다.
 *
 * value에 button·a 같은 인터랙티브 요소를 넣지 않는다. 행 전체가 button이므로 중첩되면
 * HTML이 깨지고 탭 대상이 갈린다. 값 자리의 유도 문구는 비인터랙티브 span으로 둔다.
 */
export function TappableField({ label, value, onTap }: TappableFieldProps) {
  const field = (
    <span className="min-w-0 flex-1">
      <InvestmentField label={label} value={value} />
    </span>
  )

  if (!onTap) {
    return (
      <div className={ROW_CLASS}>
        {field}
        <span className="h-4 w-4 shrink-0" aria-hidden />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onTap}
      className={`${ROW_CLASS} hover:bg-muted/30 transition-colors`}
    >
      {field}
      <CaretRight className="h-4 w-4 shrink-0 text-foreground-subtle" weight="bold" aria-hidden />
    </button>
  )
}
