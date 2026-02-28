'use client'

import { useEffect } from 'react'
import { Investment } from '@/app/types/investment'
import { InvestmentTabProvider, useInvestmentTabContext } from '@/app/contexts/InvestmentTabContext'
import { useScrollHeader } from '@/app/hooks/ui/useScrollHeader'
import { useInvestmentDetailUI } from '@/app/hooks/investment/detail/useInvestmentDetailUI'
import { useInvestmentDetailHandlers } from '@/app/hooks/investment/detail/useInvestmentDetailHandlers'
import { ScrollArea } from '@/components/ui/scroll-area'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import { InvestmentDetailHeader } from '@/app/components/InvestmentDetailSections/InvestmentDetailHeader'
import type { RateSuggestion } from '@/app/components/InvestmentEditSections/InvestmentEditSheet'
import { InvestmentDetailContent } from '@/app/components/InvestmentDetailSections/InvestmentDetailContent'
import { InvestmentDetailProvider } from '@/app/components/InvestmentDetailSections/InvestmentDetailContext'

interface InvestmentDetailViewProps {
  item: Investment
  onBack: () => void
  onUpdate: (data: { monthly_amount: number; period_years: number; annual_rate: number; investment_days?: number[] }) => Promise<void>
  onDelete: () => Promise<void>
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

import { usePaymentHistory } from '@/app/hooks/payment/usePaymentHistory'

function InternalInvestmentDetailView({
  item,
  onBack,
  onUpdate,
  onDelete,
  calculateFutureValue,
}: InvestmentDetailViewProps) {
  // Context
  const {
    activeTab,
    handleTabClick,
    scrollContainerRef,
    overviewRef,
    infoRef,
    historyRef,
    titleRef,
  } = useInvestmentTabContext()

  const { showStickyTitle } = useScrollHeader(titleRef)

  // Payment History Hook
  const { completedPayments } = usePaymentHistory()

  // UI 상태 훅
  const {
    showDeleteModal,
    setShowDeleteModal,
    isEditMode,
    setIsEditMode,
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
    calculateFutureValue,
    isEditMode,
    setIsEditMode,
    setIsDaysPickerOpen,
    completedPayments,
  })

  // 수정 모드 진입 시 초기화
  useEffect(() => {
    if (isEditMode) {
      investmentData.initializeFromItem(item)
      setIsDaysPickerOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, item])


  // 공통 props
  const originalRate = item.annual_rate || 10
  const formatRate = (rate: number) => rate.toFixed(2).replace(/\.?0+$/, '')
  const rateSuggestions: RateSuggestion[] = [
    { label: '⚡️ 10년 평균 {rate}', rate: originalRate },
  ]
  const isCustomRate = !!item.is_custom_rate

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
          setIsDaysPickerOpen,
        },
        handlers: {
          onSave: handleSave,
          onCancel: handleCancel,
          onDelete: handleDelete,
        },
        config: {
          originalRate,
          formatRate,
          rateSuggestions,
          isCustomRate,
        },
      }}
    >
      {/* 상단 고정 헤더: 홈/통계/캘린더/설정과 동일 패턴 (Safe Area + 48px) */}
      <header
        className="fixed inset-x-0 top-0 z-30 w-full bg-background border-b border-border-subtle-lighter"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)',
        }}
      >
        <div className="h-12 min-h-[48px] max-h-[48px] flex items-center shrink-0">
          <InvestmentDetailHeader
            item={item}
            onBack={onBack}
            showStickyTitle={showStickyTitle}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            setShowDeleteModal={setShowDeleteModal}
            notificationOn={investmentData.notificationOn}
            toggleNotification={investmentData.toggleNotification}
          />
        </div>
      </header>

      <ScrollArea
        viewportRef={scrollContainerRef}
        className="fixed inset-0 z-20 h-dvh bg-background"
      >
        <div
          className="min-h-dvh"
          style={{
            // 고정 헤더 높이(Safe Area + 48px) + 여유 8px
            paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px + 8px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
          }}
        >
          <InvestmentDetailContent />

          {/* 삭제 확인 모달 */}
          <DeleteConfirmModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            isDeleting={isDeleting}
          />
        </div>
      </ScrollArea>
    </InvestmentDetailProvider>
  )
}

// InvestmentDetailViewWithProvider로 감싸서 내보내기
export default function InvestmentDetailView(props: InvestmentDetailViewProps) {
  return (
    <InvestmentTabProvider>
      <InternalInvestmentDetailView {...props} />
    </InvestmentTabProvider>
  )
}
