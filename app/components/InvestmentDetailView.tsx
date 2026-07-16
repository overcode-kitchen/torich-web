'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellSlash, DotsThreeVertical } from '@phosphor-icons/react'
import { Investment } from '@/app/types/investment'
import { InvestmentTabProvider, useInvestmentTabContext } from '@/app/contexts/InvestmentTabContext'
import { useScrollHeader } from '@/app/hooks/ui/useScrollHeader'
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
import { cn } from '@/lib/utils'

interface InvestmentDetailViewProps {
  item: Investment
  onBack: () => void
  onUpdate: (data: { monthly_amount: number; period_years: number | null; annual_rate: number; investment_days?: number[] }) => Promise<void>
  onDelete: () => Promise<void>
}

import { usePaymentHistory } from '@/app/hooks/payment/usePaymentHistory'
import { useGlobalNotification } from '@/app/hooks/notification/useGlobalNotification'

function InternalInvestmentDetailView({
  item,
  onBack,
  onUpdate,
  onDelete,
}: InvestmentDetailViewProps) {
  const router = useRouter()

  // Context (스크롤 컨테이너·제목 ref만 필요. 탭 ref는 InvestmentDetailContent가 직접 사용)
  const { scrollContainerRef, titleRef } = useInvestmentTabContext()

  const { showStickyTitle } = useScrollHeader(titleRef)

  // Payment History Hook
  const {
    completedPayments,
    retroactivePayments,
    toggleRetroactivePayment,
    markAllRetroactivePaid,
  } = usePaymentHistory()

  // Global notification setting (read-only)
  const { notificationOn: isGlobalNotificationOn } = useGlobalNotification()

  // UI 상태 훅
  const {
    showDeleteModal,
    setShowDeleteModal,
    isEditMode,
    setIsEditMode,
    isDaysPickerOpen,
    setIsDaysPickerOpen,
  } = useInvestmentDetailUI()

  // 핸들러 훅
  const {
    investmentData,
    isDeleting,
    isUpdating,
    handleSave,
    handleCancel,
    handleDelete,
  } = useInvestmentDetailHandlers({
    item,
    onUpdate,
    onDelete,
    isEditMode,
    setIsEditMode,
    setIsDaysPickerOpen,
    completedPayments,
    retroactivePayments,
    onToggleRetroactive: toggleRetroactivePayment,
    onMarkAllRetroactive: markAllRetroactivePaid,
  })

  // 수정 모드 진입 시 초기화
  useEffect(() => {
    if (isEditMode) {
      investmentData.initializeFromItem(item)
      setIsDaysPickerOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, item])

  // 종목 상세 진입 시 시세 캐시 갱신 + shares 모드면 monthly_amount 동기화
  useShareModeSync(item)

  // 과거 시작일 투자 추가 후 진입 시 소급 안내 시트
  const retroOnboarding = useRetroactiveOnboarding({
    retroactivePaymentHistory: investmentData.retroactivePaymentHistory,
  })

  const isNotificationDisabled = !isGlobalNotificationOn

  // 헤더 우측 액션: 알림 토글 + 더보기 메뉴 (수정 모드에서는 숨김)
  const headerActions = !isEditMode ? (
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
  ) : undefined

  return (
    <InvestmentDetailProvider
      value={{
        item,
        isEditMode,
        investmentData,
        ui: {
          isDeleting,
          isUpdating,
          showDeleteModal,
          setShowDeleteModal,
          setIsEditMode,
          isDaysPickerOpen,
          setIsDaysPickerOpen,
        },
        handlers: {
          onSave: handleSave,
          onCancel: handleCancel,
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
          showStickyTitle ? (
            <h1 className="text-center text-base font-semibold tracking-tight text-foreground truncate">
              {item.title}
            </h1>
          ) : undefined
        }
      >
        <InvestmentDetailContent />

        {/* 삭제 확인 모달 */}
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      </SubPageScaffold>

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
