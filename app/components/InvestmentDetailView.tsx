'use client'

import { useEffect } from 'react'
import { Investment } from '@/app/types/investment'
import { InvestmentTabProvider, useInvestmentTabContext } from '@/app/contexts/InvestmentTabContext'
import { useScrollHeader } from '@/app/hooks/useScrollHeader'
import { useInvestmentDetailUI } from '@/app/hooks/useInvestmentDetailUI'
import { useInvestmentDetailHandlers } from '@/app/hooks/useInvestmentDetailHandlers'
import DeleteConfirmModal from '@/app/components/DeleteConfirmModal'
import { ProgressSection } from '@/app/components/InvestmentDetailSections/ProgressSection'
import { InfoSection } from '@/app/components/InvestmentDetailSections/InfoSection'
import { PaymentHistorySection } from '@/app/components/InvestmentDetailSections/PaymentHistorySection'
import { InvestmentDetailHeader } from '@/app/components/InvestmentDetailHeader'
import { InvestmentDetailOverview } from '@/app/components/InvestmentDetailOverview'
import { InvestmentDetailActions } from '@/app/components/InvestmentDetailActions'
import type { RateSuggestion } from '@/app/components/InvestmentEditSheet'

interface InvestmentDetailViewProps {
  item: Investment
  onBack: () => void
  onUpdate: (data: { monthly_amount: number; period_years: number; annual_rate: number; investment_days?: number[] }) => Promise<void>
  onDelete: () => Promise<void>
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

function InternalInvestmentDetailView({
  item,
  onBack,
  onUpdate,
  onDelete,
  calculateFutureValue,
}: InvestmentDetailViewProps) {
  // Context
  const {
    scrollContainerRef,
    infoRef,
    historyRef,
    titleRef,
  } = useInvestmentTabContext()

  const { showStickyTitle } = useScrollHeader(titleRef)

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
    <div ref={scrollContainerRef} className="fixed inset-0 z-50 bg-background overflow-y-auto">
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

      {/* 콘텐츠 - 좌우 24px 단일 여백, 가변 컨테이너 폭 */}
      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-6 pb-12">
        <InvestmentDetailOverview
          item={item}
          isEditMode={isEditMode}
          nextPaymentDate={investmentData.nextPaymentDate}
          completed={investmentData.completed}
        />

        {/* 진행률 - 수정 모드에서는 숨김 */}
        {!isEditMode && (
          <ProgressSection
            progress={investmentData.progress}
            completed={investmentData.completed}
            startDate={investmentData.startDate}
            endDate={investmentData.endDate}
          />
        )}

        <div className="divide-y divide-border-subtle-lighter">
          <InfoSection
            item={item}
            isEditMode={isEditMode}
            editMonthlyAmount={investmentData.editMonthlyAmount}
            setEditMonthlyAmount={investmentData.setEditMonthlyAmount}
            editPeriodYears={investmentData.editPeriodYears}
            setEditPeriodYears={investmentData.setEditPeriodYears}
            editAnnualRate={investmentData.editAnnualRate}
            setEditAnnualRate={investmentData.setEditAnnualRate}
            editInvestmentDays={investmentData.editInvestmentDays}
            setEditInvestmentDays={investmentData.setEditInvestmentDays}
            setIsDaysPickerOpen={setIsDaysPickerOpen}
            handleNumericInput={investmentData.handleNumericInput}
            handleRateInput={investmentData.handleRateInput}
            displayAnnualRate={investmentData.displayAnnualRate}
            totalPrincipal={investmentData.totalPrincipal}
            calculatedProfit={investmentData.calculatedProfit}
            calculatedFutureValue={investmentData.calculatedFutureValue}
            originalRate={originalRate}
            isRateManuallyEdited={investmentData.isRateManuallyEdited}
            setIsRateManuallyEdited={investmentData.setIsRateManuallyEdited}
            formatRate={formatRate}
            rateSuggestions={rateSuggestions}
            isCustomRate={isCustomRate}
            infoRef={infoRef}
          />
          {investmentData.paymentHistory.length > 0 && (
            <PaymentHistorySection
              item={item}
              paymentHistory={investmentData.paymentHistory}
              hasMorePaymentHistory={investmentData.hasMorePaymentHistory}
              loadMore={investmentData.loadMore}
              historyRef={historyRef}
            />
          )}
        </div>

        {isEditMode && (
          <InvestmentDetailActions
            handleCancel={handleCancel}
            handleSave={handleSave}
            isUpdating={isUpdating}
          />
        )}
      </div>

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
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
