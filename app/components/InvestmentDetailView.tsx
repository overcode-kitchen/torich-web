'use client'

import { useRouter } from 'next/navigation'
import { Bell, BellSlash, DotsThreeVertical } from '@phosphor-icons/react'
import { Investment } from '@/app/types/investment'
import { InvestmentTabProvider, useInvestmentTabContext } from '@/app/contexts/InvestmentTabContext'
import { DetailHeaderTitle } from '@/app/components/Common/DetailHeaderTitle'
import { RecordAvatar } from '@/app/components/Common/RecordAvatar'
import { useInvestmentDetailUI } from '@/app/hooks/investment/detail/useInvestmentDetailUI'
import { useInvestmentDetailHandlers } from '@/app/hooks/investment/detail/useInvestmentDetailHandlers'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InvestmentDetailContent } from '@/app/components/InvestmentDetailSections/InvestmentDetailContent'
import { InvestmentDetailProvider } from '@/app/components/InvestmentDetailSections/InvestmentDetailContext'
import { RetroactiveOnboardingSheet } from '@/app/components/InvestmentDetailSections/RetroactiveOnboardingSheet'
import { useRetroactiveOnboarding } from '@/app/hooks/investment/detail/useRetroactiveOnboarding'
import { useShareModeSync } from '@/app/hooks/investment/detail/useShareModeSync'
import { useMonthToggleUndo } from '@/app/hooks/payment/useMonthToggleUndo'
import { UndoToastSection } from '@/app/components/CalendarSections/UndoToastSection'
import { cn } from '@/lib/utils'

interface InvestmentDetailViewProps {
  item: Investment
  onBack: () => void
  onDelete: () => Promise<void>
}

import { usePaymentHistoryContext } from '@/app/contexts/PaymentHistoryContext'
import { useRefreshPaymentHistoryOnMount } from '@/app/hooks/payment/useRefreshPaymentHistoryOnMount'
import { useGlobalNotification } from '@/app/hooks/notification/useGlobalNotification'

function InternalInvestmentDetailView({
  item,
  onBack,
  onDelete,
}: InvestmentDetailViewProps) {
  const router = useRouter()

  // Context (스크롤 컨테이너 ref만 필요. 탭 ref는 InvestmentDetailContent가 직접 사용)
  const { scrollContainerRef } = useInvestmentTabContext()

  // Payment History (전역 상태) + 상세 진입 시 1회 갱신
  const {
    completedPayments,
    retroactivePayments,
    togglePayment,
    toggleRetroactivePayment,
    markAllRetroactivePaid,
  } = usePaymentHistoryContext()
  useRefreshPaymentHistoryOnMount()

  // 월 회차 토글 + 하단 되돌리기 토스트 (홈과 동일한 UndoToastSection 사용)
  const monthUndo = useMonthToggleUndo(togglePayment)

  // Global notification setting (read-only)
  const { notificationOn: isGlobalNotificationOn } = useGlobalNotification()

  // UI 상태 훅
  const {
    showDeleteModal,
    setShowDeleteModal,
  } = useInvestmentDetailUI()

  // 핸들러 훅
  const {
    investmentData,
    isDeleting,
    handleDelete,
  } = useInvestmentDetailHandlers({
    item,
    onDelete,
    completedPayments,
    retroactivePayments,
    onToggleRetroactive: toggleRetroactivePayment,
    onMarkAllRetroactive: markAllRetroactivePaid,
    onToggleAuto: (recordId, yearMonth, currentCompleted) =>
      monthUndo.onToggleAuto(item, completedPayments.get(recordId), yearMonth, currentCompleted),
  })

  // 종목 상세 진입 시 시세 캐시 갱신 + shares 모드면 monthly_amount 동기화
  useShareModeSync(item)

  // 과거 시작일 투자 추가 후 진입 시 소급 안내 시트
  const retroOnboarding = useRetroactiveOnboarding({
    retroactivePaymentHistory: investmentData.retroactivePaymentHistory,
  })

  const isNotificationDisabled = !isGlobalNotificationOn

  // 정보 행 탭 → 토스 스타일 편집 플로우(/add?editId=...&field=...)로 진입.
  // 예적금·현금 상세(SavingsCashDetailView)와 동일한 규약. (이슈 #72)
  const handleFieldTap = (field: string): void => {
    router.push(`/add?editId=${item.id}&field=${field}`)
  }

  // 헤더 우측 액션: 알림 토글 + 더보기 메뉴
  const headerActions = (
    <div className="flex items-center -mr-1">
      <button
        type="button"
        onClick={investmentData.toggleNotification}
        disabled={isNotificationDisabled}
        aria-disabled={isNotificationDisabled}
        aria-label={investmentData.notificationOn ? '알림 끄기' : '알림 켜기'}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-surface-hover transition-colors',
          isNotificationDisabled && 'text-foreground-subtle cursor-not-allowed hover:bg-transparent',
        )}
      >
        {investmentData.notificationOn ? (
          <Bell className="h-6 w-6" weight="regular" />
        ) : (
          <BellSlash className="h-6 w-6 text-muted-foreground" weight="regular" />
        )}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-surface-hover transition-colors"
            aria-label="메뉴"
          >
            <DotsThreeVertical className="h-6 w-6" weight="regular" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/add?editId=${item.id}`)}>수정하기</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteModal(true)}
            className="text-destructive focus:text-destructive"
          >
            삭제하기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <InvestmentDetailProvider
      value={{
        item,
        investmentData,
        ui: {
          isDeleting,
          showDeleteModal,
          setShowDeleteModal,
        },
        handlers: {
          onDelete: handleDelete,
        },
      }}
    >
      <SubPageScaffold
        onBack={onBack}
        surfaceClassName="bg-background"
        contentClassName="px-0"
        scrollContainerRef={scrollContainerRef}
        actions={headerActions}
        centerSlot={
          <DetailHeaderTitle
            title={item.title}
            leading={<RecordAvatar record={item} size="sm" />}
          />
        }
      >
        <InvestmentDetailContent onFieldTap={handleFieldTap} />

        {/* 삭제 확인 모달 */}
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      </SubPageScaffold>

      {/* 월 회차 되돌리기 토스트 (하단) */}
      <UndoToastSection
        pendingUndo={monthUndo.pendingUndo}
        handleUndo={() => void monthUndo.handleUndo()}
        label={monthUndo.undoLabel}
      />

      {/* 소급 안내 시트 (과거 시작일로 등록 후 진입 시) */}
      <RetroactiveOnboardingSheet
        isOpen={retroOnboarding.isOpen}
        rangeStart={retroOnboarding.rangeStart}
        rangeEnd={retroOnboarding.rangeEnd}
        monthsCount={retroOnboarding.monthsCount}
        onRecordNow={retroOnboarding.onRecordNow}
        onLater={retroOnboarding.onLater}
      />
    </InvestmentDetailProvider>
  )
}

// InvestmentDetailViewWithProvider로 감싸서 내보내기
export default function InvestmentDetailView(props: InvestmentDetailViewProps) {
  return (
    <InvestmentTabProvider initialTab="info">
      <InternalInvestmentDetailView {...props} />
    </InvestmentTabProvider>
  )
}
