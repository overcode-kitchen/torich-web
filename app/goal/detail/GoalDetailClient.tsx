'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CircleNotch, DotsThreeVertical } from '@phosphor-icons/react'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import { DetailHero } from '@/app/components/Common/DetailHero'
import { DetailHeaderTitle } from '@/app/components/Common/DetailHeaderTitle'
import { DetailTabs } from '@/app/components/Common/DetailTabs'
import { GoalInfoSection } from '@/app/components/GoalDetailSections/GoalInfoSection'
import { LinkedRecordsSection } from '@/app/components/GoalDetailSections/LinkedRecordsSection'
import { UnlinkedRecordsSection } from '@/app/components/GoalDetailSections/UnlinkedRecordsSection'
import { useGoalProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import { useGoalUpdate } from '@/app/hooks/goal/data/useGoalUpdate'
import { useGoalDelete } from '@/app/hooks/goal/data/useGoalDelete'
import { useInvestmentGoalLink } from '@/app/hooks/goal/data/useInvestmentGoalLink'
import { useGoalDetail } from '@/app/hooks/goal/detail/useGoalDetail'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { scrollToDetailSection } from '@/app/utils/scrollToDetailSection'
import { deriveGoalStatus } from '@/app/utils/goal-status'
import { usePaymentHistoryContext } from '@/app/contexts/PaymentHistoryContext'
import { amountBucket, daysBetween, track } from '@/app/lib/analytics'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { resolvePurposeIcon } from '@/app/constants/goal'
import { formatKoreanDate } from '@/app/utils/date'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'

export default function GoalDetailClient() {
  const searchParams = useSearchParams()
  const goalId = searchParams.get('id') ?? undefined
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [showArchiveModal, setShowArchiveModal] = useState<boolean>(false)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('info')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)
  const linkedRef = useRef<HTMLDivElement>(null)
  const { goBack } = useFlowBack({
    rootPath: '/',
    enableHistoryFallback: true,
  })

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
    })
  }, [])

  const { goal, records, unlinkedRecords, isLoading, refetch, setGoal } =
    useGoalDetail(goalId, userId)
  const { completedPayments, retroactivePayments, capturedAmounts } = usePaymentHistoryContext()
  const progress = useGoalProgress(
    goal,
    records,
    completedPayments,
    retroactivePayments,
    capturedAmounts,
  )
  const { updateGoal, archiveGoal, isUpdating } = useGoalUpdate(userId)
  const { deleteGoal, isDeleting } = useGoalDelete(userId)
  const { linkRecordToGoal, isLinking } = useInvestmentGoalLink(userId)

  // 보관은 완료(기간 종료 포함)된 목적만 가능하다. 홈 카드와 동일한 파생 상태 기준.
  const isCompletedGoal =
    goal && progress
      ? deriveGoalStatus({
          goal,
          linkedRecords: records,
          accumulatedAmount: progress.currentValue,
          now: new Date(),
        }) === 'completed'
      : false

  useEffect(() => {
    if (!goal || !progress) return
    if (goal.completed_at === null && progress.isCompleted) {
      const completedAt = new Date().toISOString()
      void updateGoal(goal.id, { completed_at: completedAt }).then((updated) => {
        if (!updated) return
        setGoal(updated)
        track('goal_completed', {
          target_amount_bucket: amountBucket(goal.target_amount),
          days_to_complete: daysBetween(goal.created_at, completedAt),
          linked_record_count: records.length,
        })
      })
    }
  }, [goal, progress, updateGoal, setGoal, records.length])

  function handleTabClick(tab: string): void {
    setActiveTab(tab)
    const target = tab === 'info' ? infoRef.current : linkedRef.current
    scrollToDetailSection(scrollContainerRef.current, target)
  }

  async function confirmArchive(): Promise<void> {
    if (!goal) return
    await archiveGoal(goal.id)
    track('goal_archive', { entry_point: 'detail_menu' })
    router.push('/')
  }

  async function confirmDelete(): Promise<void> {
    if (!goal) return
    await deleteGoal(goal.id)
    track('goal_delete', { entry_point: 'detail_menu' })
    router.push('/')
  }

  async function handleLink(recordId: string): Promise<void> {
    if (!goal) return
    const linked = unlinkedRecords.find((r) => r.id === recordId)
    await linkRecordToGoal(recordId, goal.id)
    if (linked) {
      track('goal_record_linked', {
        monthly_amount_bucket: amountBucket(linked.monthly_amount),
      })
    }
    await refetch()
  }

  async function handleUnlink(recordId: string): Promise<void> {
    await linkRecordToGoal(recordId, null)
    await refetch()
  }

  if (isLoading) {
    return (
      <SubPageScaffold onBack={goBack} surfaceClassName="bg-background" contentClassName="px-6 py-6">
        <div className="flex items-center justify-center py-16">
          <CircleNotch className="w-6 h-6 animate-spin text-foreground-subtle" />
        </div>
      </SubPageScaffold>
    )
  }

  if (!goal || !progress) {
    return (
      <SubPageScaffold onBack={goBack} surfaceClassName="bg-background" contentClassName="px-6 py-6">
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-sm text-foreground-subtle">
            목적을 찾을 수 없습니다.
          </p>
          <Button onClick={() => router.push('/')}>홈으로</Button>
        </div>
      </SubPageScaffold>
    )
  }

  const icon = resolvePurposeIcon(goal.emoji)
  const remaining = Math.max(0, goal.target_amount - progress.currentValue)
  const isPastDue =
    progress.dDay !== null &&
    progress.dDay < 0 &&
    goal.archived_at === null &&
    !progress.isCompleted

  // 히어로 숫자("모은 금액") 아래 보조 줄. 회색 진행 박스를 없앴으므로
  // 달성/마감지남/남은금액/목표미설정 상태를 모두 이 sub로 모은다(정보 무손실).
  const heroSub =
    progress.progressPercent === null
      ? '목표 금액을 정하면 진행률을 볼 수 있어요.'
      : progress.isCompleted
        ? <span className="font-semibold text-success">🎉 목표를 달성했어요</span>
        : isPastDue
          ? <span>마감일이 지났어요 · 달성률 {progress.progressPercent}%</span>
          : `목표까지 ${formatCurrency(remaining)}`

  const headerActions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="더보기"
          className="p-2 -mr-1 text-foreground-soft hover:text-foreground transition-colors"
        >
          <DotsThreeVertical className="w-6 h-6" weight="bold" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        <DropdownMenuItem onSelect={() => router.push(`/goal/detail/edit?id=${goal.id}`)}>
          수정하기
        </DropdownMenuItem>
        {isCompletedGoal && (
          <DropdownMenuItem
            onSelect={() => setShowArchiveModal(true)}
            disabled={isUpdating}
          >
            보관하기
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => setShowDeleteModal(true)}
          disabled={isDeleting}
          variant="destructive"
        >
          삭제하기
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <SubPageScaffold
      onBack={goBack}
      surfaceClassName="bg-background"
      contentClassName="px-6"
      actions={headerActions}
      scrollContainerRef={scrollContainerRef}
      centerSlot={
        <DetailHeaderTitle
          title={goal.name}
          leading={
            icon ? (
              <Image
                src={icon.src}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 object-contain"
              />
            ) : undefined
          }
        />
      }
    >
      {/* 이름·아이콘은 앱바(centerSlot)에 상주하고, 본문 최상단은 "모은 금액" 히어로 하나로
          유지한다. 진행 바(모은/목표 금액)를 별도 카드 대신 히어로에 종속시킨다.
          투자 상세("총 납입액")와 동일 규격. */}
      <DetailHero
        className="pt-6"
        label="모은 금액"
        amount={formatCurrency(progress.currentValue)}
        progress={
          progress.progressPercent !== null
            ? {
                percent: progress.progressPercent,
                completed: progress.isCompleted,
                startLabel: formatKoreanDate(new Date(goal.created_at)),
                endLabel: goal.target_date
                  ? formatKoreanDate(new Date(goal.target_date))
                  : undefined,
                ariaLabel: '목적 진행률',
              }
            : undefined
        }
        sub={heroSub}
      />

      {/* 메모: 이름 블록을 앱바로 올린 뒤, 목적 설명은 히어로 아래 보조 줄로 종속시킨다. */}
      {goal.memo?.trim() && (
        <p className="-mt-2 mb-2 text-sm text-foreground-muted whitespace-pre-line break-words">
          {goal.memo}
        </p>
      )}

      {/* 섹션 탭바 */}
      <DetailTabs
        tabs={[
          { key: 'info', label: '목적 정보' },
          { key: 'linked', label: `묶인 투자${records.length > 0 ? ` (${records.length})` : ''}` },
        ]}
        activeTab={activeTab}
        onTabClick={handleTabClick}
        bleedClassName="-mx-6 px-6"
      />

      <div ref={infoRef}>
        <GoalInfoSection
          goal={goal}
          progress={progress}
          onSetTarget={() => router.push(`/goal/detail/edit?id=${goal.id}`)}
        />
      </div>

      <div ref={linkedRef}>
        <LinkedRecordsSection
          records={records}
          isLinking={isLinking}
          onUnlink={(id) => void handleUnlink(id)}
          onOpenRecord={(id) => router.push(`/investment?id=${id}`)}
        />
      </div>

      <UnlinkedRecordsSection
        records={unlinkedRecords}
        isLinking={isLinking}
        onLink={(id) => void handleLink(id)}
        onOpenRecord={(id) => router.push(`/investment?id=${id}`)}
      />

      <DeleteConfirmModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={confirmArchive}
        isDeleting={isUpdating}
        tone="primary"
        confirmLabel="보관"
        confirmingLabel="보관 중..."
        title="목적을 보관할까요?"
        description={`"${goal.name}"을(를) 보관함으로 옮겨요. 묶인 투자는 그대로 유지되고, 설정 › 보관한 목표에서 언제든 다시 꺼낼 수 있어요.`}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="목적을 삭제할까요?"
        description={`"${goal.name}"을(를) 영구 삭제해요. 되돌릴 수 없고, 묶였던 투자는 자유 상태로 돌아가요.`}
      />
    </SubPageScaffold>
  )
}
