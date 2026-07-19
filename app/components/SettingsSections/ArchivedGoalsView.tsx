'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Archive, CircleNotch } from '@phosphor-icons/react'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import { Button } from '@/components/ui/button'
import { resolvePurposeIcon } from '@/app/constants/goal'
import { formatKoreanDate } from '@/app/utils/date'
import { formatCurrency } from '@/lib/utils'
import type { Goal } from '@/app/types/goal'

interface ArchivedGoalsViewProps {
  goals: Goal[]
  isLoading: boolean
  /** 복원/삭제 진행 중 (버튼 비활성화용) */
  isBusy: boolean
  onRestore: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onBack: () => void
}

/**
 * 보관한 목표 화면 (설정 › 보관한 목표).
 * - 완료 후 보관한 목적을 카드로 나열.
 * - 각 목적: 복원(보관 해제, 투자 연결 유지) / 영구 삭제(되돌릴 수 없음).
 */
export default function ArchivedGoalsView({
  goals,
  isLoading,
  isBusy,
  onRestore,
  onDelete,
  onBack,
}: ArchivedGoalsViewProps) {
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null)

  // 최근에 보관/달성한 목적이 위로.
  const sorted = useMemo(
    () =>
      [...goals].sort((a, b) => {
        const aKey = a.archived_at ?? a.completed_at ?? a.created_at
        const bKey = b.archived_at ?? b.completed_at ?? b.created_at
        return bKey.localeCompare(aKey)
      }),
    [goals],
  )

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return
    await onDelete(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <SubPageScaffold onBack={onBack} contentClassName="py-2 space-y-4">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-foreground mb-1">보관한 목표</h1>
        <p className="text-sm text-foreground-subtle">
          완료해서 보관한 목표예요. 복원하면 홈에서 다시 볼 수 있어요.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <CircleNotch className="w-6 h-6 animate-spin text-foreground-subtle" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Archive className="w-10 h-10 text-foreground-subtle" weight="light" />
          <p className="text-sm text-foreground-muted">아직 보관한 목표가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((goal) => {
            const icon = resolvePurposeIcon(goal.emoji)
            const dateSource = goal.completed_at ?? goal.archived_at
            const dateLabel = dateSource
              ? formatKoreanDate(new Date(dateSource))
              : null
            return (
              <div key={goal.id} className="rounded-2xl bg-card p-4">
                <div className="flex items-center gap-3">
                  {icon && (
                    <Image
                      src={icon.src}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {goal.name}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      {goal.completed_at ? '🎉 달성' : '보관'}
                      {dateLabel && ` · ${dateLabel}`}
                      {goal.target_amount > 0 &&
                        ` · 목표 ${formatCurrency(goal.target_amount)}`}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="tonal"
                    size="sm"
                    className="flex-1"
                    disabled={isBusy}
                    onClick={() => void onRestore(goal.id)}
                  >
                    복원
                  </Button>
                  <Button
                    variant="soft"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={isBusy}
                    onClick={() => setDeleteTarget(goal)}
                  >
                    영구 삭제
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isDeleting={isBusy}
        title="목적을 영구 삭제할까요?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}"을(를) 완전히 삭제해요. 되돌릴 수 없어요.`
            : ''
        }
      />
    </SubPageScaffold>
  )
}
