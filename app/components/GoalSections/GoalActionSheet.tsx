'use client'

import { createPortal } from 'react-dom'
import { PencilSimple, Archive, Trash } from '@phosphor-icons/react'

interface GoalActionSheetProps {
  isOpen: boolean
  onClose: () => void
  /** 시트 상단에 표시할 목적 이름 */
  goalName: string
  onEdit: () => void
  /** 전달되면 "보관하기" 항목을 노출한다(보관함으로 이동, 복원 가능). */
  onArchive?: () => void
  onDelete: () => void
}

/**
 * 홈 목적 카드를 길게 눌렀을 때 뜨는 하단 액션 시트.
 * 상세 페이지 더보기 메뉴와 항목·순서(수정 → 보관 → 삭제)를 맞춘다.
 * - 수정하기 → 목적 수정 페이지
 * - 보관하기 → 보관함으로 이동(복원 가능)
 * - 삭제하기 → (부모가) 삭제 확인 모달을 띄운다.
 *
 * DeleteConfirmModal과 동일하게 `document.body`로 포털한다. 목적 카드는
 * `relative z-10`으로 스태킹 컨텍스트를 만들어, 그 안에서 렌더하면 dim이
 * 카드 뒤로 깔리고 바깥 터치가 새어 나가기 때문이다.
 */
export default function GoalActionSheet({
  isOpen,
  onClose,
  goalName,
  onEdit,
  onArchive,
  onDelete,
}: GoalActionSheetProps) {
  // 정적 export(prerender) 단계엔 document가 없다. 모든 호출부가 isOpen=false로
  // 시작하므로 이 가드로 하이드레이션 불일치 없이 서버 렌더만 건너뛴다.
  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* 하단 시트 */}
      <div className="relative z-[60] mx-auto w-full max-w-md p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="overflow-hidden rounded-2xl bg-card">
          <div className="px-5 py-3">
            <p className="truncate text-center text-sm font-semibold text-foreground-soft">
              {goalName}
            </p>
          </div>
          <div aria-hidden className="h-px bg-border-subtle-lighter" />
          <button
            type="button"
            onClick={onEdit}
            className="flex w-full items-center gap-3 px-5 py-4 text-left text-base font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            <PencilSimple className="h-5 w-5 shrink-0" weight="bold" />
            수정하기
          </button>
          {onArchive && (
            <>
              <div aria-hidden className="h-px bg-border-subtle-lighter" />
              <button
                type="button"
                onClick={onArchive}
                className="flex w-full items-center gap-3 px-5 py-4 text-left text-base font-medium text-foreground transition-colors hover:bg-surface-hover"
              >
                <Archive className="h-5 w-5 shrink-0" weight="bold" />
                보관하기
              </button>
            </>
          )}
          <div aria-hidden className="h-px bg-border-subtle-lighter" />
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center gap-3 px-5 py-4 text-left text-base font-medium text-destructive transition-colors hover:bg-surface-hover"
          >
            <Trash className="h-5 w-5 shrink-0" weight="bold" />
            삭제하기
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-2xl bg-card py-4 text-base font-semibold text-foreground-soft transition-colors hover:bg-surface-hover"
        >
          취소
        </button>
      </div>
    </div>,
    document.body,
  )
}
