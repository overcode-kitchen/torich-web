'use client'

import { useCallback, useEffect, useRef } from 'react'
import { CaretDown, Plus } from '@phosphor-icons/react'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import {
  useDrawerPull,
  HANDLE_PEEK,
  OPEN_HEIGHT,
} from '@/app/hooks/ui/useDrawerPull'
import { getWiggleStyle } from '@/app/utils/wiggle'

/** 서랍 상단이 카드 뒤로 파고드는 양(px). 이만큼은 카드에 가려 안 보인다. */
const TUCK = 20
/**
 * 커밋 확정 후 실제 이동까지의 지연(ms).
 * 서랍이 열리는 모션을 잠깐 보여준 뒤 이동해, 라우트가 "휙!" 튀는 느낌을 없앤다.
 * (진입 페이지 쪽은 animate-page-in 슬라이드-인으로 이어받는다)
 */
const COMMIT_DELAY = 200

interface AddRecordDrawerProps {
  goalId: string
  onAddRecord: (goalId: string) => void
}

/**
 * 카드 하단 뒤로 삐져나온 초록 손잡이.
 * 아래로 잡아당겨 임계점을 넘기면 적립 항목 추가 화면으로 이동한다(탭으로는 이동하지 않음).
 * - 세로 드래그 제스처는 useDrawerPull(native touch, passive:false)이 담당.
 * - 열림 확정 시 가벼운 햅틱 후 이동.
 * - 바깥 요소가 히트 영역(초록 영역보다 좌우·아래로 살짝 넓음), 안쪽 요소가 실제 초록 손잡이.
 */
export function AddRecordDrawer({
  goalId,
  onAddRecord,
}: AddRecordDrawerProps) {
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (commitTimer.current) clearTimeout(commitTimer.current)
    },
    [],
  )

  const handleCommit = useCallback(() => {
    // 열림 확정 시점에 햅틱을 먼저 주고, 서랍이 열리는 모션을 잠깐 보여준 뒤 이동한다.
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
    if (commitTimer.current) clearTimeout(commitTimer.current)
    commitTimer.current = setTimeout(() => onAddRecord(goalId), COMMIT_DELAY)
  }, [goalId, onAddRecord])

  const { ref, revealed, isDragging, commit } = useDrawerPull({
    onCommit: handleCommit,
  })

  // 노출 높이에 비례해 라벨이 서서히 드러난다 (collapsed=0 → open=1)
  const labelOpacity = Math.max(
    0,
    Math.min(1, (revealed - HANDLE_PEEK) / (OPEN_HEIGHT - HANDLE_PEEK)),
  )

  return (
    // 바깥: 드래그/터치 히트 영역. px/pb로 초록 영역보다 넓게, -mb로 레이아웃은 그대로 유지.
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label="적립 항목 추가"
      onKeyDown={(e) => {
        // 탭/터치로는 이동하지 않음. 키보드로 포커스한 경우에만 명시적 실행.
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          commit()
        }
      }}
      className="relative z-0 flex touch-none select-none justify-end rounded-2xl px-4 pb-3 -mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ marginTop: -TUCK }}
    >
      {/* 안쪽: 실제 보이는 초록 손잡이 (힌트가 아래로 넘치도록 overflow 미적용) */}
      <div
        className={`relative flex w-32 items-end justify-center rounded-b-3xl bg-primary text-primary-foreground motion-reduce:!transition-none ${
          isDragging ? '' : 'animate-handle-nudge'
        }`}
        style={{
          height: TUCK + revealed,
          willChange: 'transform, height',
          // 드래그 중엔 짧게 따라오며 부드럽게, 놓으면 길게 감속하며 정착
          transition: isDragging
            ? 'height 110ms cubic-bezier(0.22, 1, 0.36, 1)'
            : 'height 460ms cubic-bezier(0.22, 1, 0.36, 1)',
          // 목적마다 다른 주기·위상으로 손잡이 넛지를 흩뿌린다(아바타와 동일한 desync).
          // 모든 카드가 서로 다른 랜덤 리듬으로 뜸하게 움직이고, 드래그 중엔 멈춘다.
          ...(isDragging ? {} : getWiggleStyle(goalId)),
        }}
      >
        {/* 펼쳐질수록 드러나는 라벨 (레이아웃에 영향 주지 않도록 absolute) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-7 flex items-center justify-center gap-1 text-[11px] font-semibold"
          style={{ opacity: labelOpacity }}
        >
          <Plus className="h-3 w-3" weight="bold" />
          적립 항목 추가
        </span>

        {/* 항상 보이는 손잡이 셰브런 (filled + 오퍼시티 낮은 흰색) */}
        <CaretDown className="mb-0.5 h-3 w-3 text-white/60" weight="fill" aria-hidden />
      </div>
    </div>
  )
}
