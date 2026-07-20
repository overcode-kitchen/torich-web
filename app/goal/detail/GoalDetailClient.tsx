'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CircleNotch, DotsThreeVertical } from '@phosphor-icons/react'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import { DetailHero } from '@/app/components/Common/DetailHero'
import { DetailProgressCard } from '@/app/components/Common/DetailProgressCard'
import { DetailTabs } from '@/app/components/Common/DetailTabs'
import { GoalInfoSection } from '@/app/components/GoalDetailSections/GoalInfoSection'
import { LinkedRecordsSection } from '@/app/components/GoalDetailSections/LinkedRecordsSection'
import { UnlinkedRecordsSection } from '@/app/components/GoalDetailSections/UnlinkedRecordsSection'
import { useGoalProgress } from '@/app/hooks/goal/calculations/useGoalProgress'
import { useGoalUpdate } from '@/app/hooks/goal/data/useGoalUpdate'
import { useGoalDelete } from '@/app/hooks/goal/data/useGoalDelete'
import { useInvestmentGoalLink } from '@/app/hooks/goal/data/useInvestmentGoalLink'
import { useGoalDetail } from '@/app/hooks/goal/detail/useGoalDetail'
import { useScrollHeader } from '@/app/hooks/ui/useScrollHeader'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { usePaymentHistory } from '@/app/hooks/payment/usePaymentHistory'
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
  const titleRef = useRef<HTMLElement>(null)
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
  const { completedPayments, retroactivePayments, capturedAmounts } = usePaymentHistory()
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

  // 제목이 스크롤로 사라지면 헤더 중앙에 스티키 제목을 띄운다(주식 상세와 동일 규약).
  // 목적 상세는 로딩 분기 뒤에야 제목이 렌더되므로, 데이터 준비 시점에 옵저버를 붙이도록 enabled를 넘긴다.
  const { showStickyTitle } = useScrollHeader(titleRef, !isLoading && !!goal && !!progress)

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
    const container = scrollContainerRef.current
    const target = tab === 'info' ? infoRef.current : linkedRef.current
    if (!container || !target) return
    const headerAndTabsHeight = 52 + 40
    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const offset =
      targetRect.top - containerRect.top + container.scrollTop - headerAndTabsHeight
    container.scrollTo({ top: offset, behavior: 'smooth' })
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

  // 진행률 박스 안에 들어갈 상태 메시지 (달성/마감 지남) — 기존 하단 카드를 위로 통합
  const progressStatus = progress.isCompleted ? (
    <p className="font-semibold text-success">🎉 목표를 달성했어요</p>
  ) : isPastDue ? (
    <p className="text-foreground-muted">
      마감일이 지났어요
      {progress.progressPercent !== null && ` · 달성률 ${progress.progressPercent}%`}
    </p>
  ) : undefined

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
        <DropdownMenuItem
          onSelect={() => setShowArchiveModal(true)}
          disabled={isUpdating}
        >
          보관하기
        </DropdownMenuItem>
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
        showStickyTitle ? (
          <h1 className="truncate text-center text-base font-semibold tracking-tight text-foreground">
            {goal.name}
          </h1>
        ) : undefined
      }
    >
      {/* 아이콘 + 제목 + 메모 */}
      <section ref={titleRef} className="pt-6 pb-5 space-y-3">
        <div className="flex items-center gap-3">
          {icon && (
            <Image
              src={icon.src}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain"
            />
          )}
          <h2 className="min-w-0 text-xl font-semibold tracking-tight text-foreground break-keep">
            {goal.name}
          </h2>
        </div>
        {goal.memo?.trim() && (
          <p className="text-sm text-foreground-muted whitespace-pre-line break-words">
            {goal.memo}
          </p>
        )}
      </section>

      {/* 진행률 박스 (목표 금액이 있을 때만) */}
      {progress.progressPercent !== null && (
        <DetailProgressCard
          percent={progress.progressPercent}
          completed={progress.isCompleted}
          startLabel={formatKoreanDate(new Date(goal.created_at))}
          endLabel={goal.target_date ? formatKoreanDate(new Date(goal.target_date)) : undefined}
          status={progressStatus}
          ariaLabel="목적 진행률"
        />
      )}

      {/* 히어로 숫자 (라벨 없이, 사용자가 바로 이해) */}
      <DetailHero
        className="pt-4"
        amount={formatCurrency(progress.currentValue)}
        sub={
          progress.progressPercent === null
            ? '목표 금액을 정하면 진행률을 볼 수 있어요.'
            : progress.isCompleted
              ? undefined
              : `목표까지 ${formatCurrency(remaining)}`
        }
      />

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
        <GoalInfoSection goal={goal} progress={progress} />
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
