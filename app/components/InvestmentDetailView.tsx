'use client'

import { useEffect } from 'react'
import { Investment } from '@/app/types/investment'
import { InvestmentTabProvider, useInvestmentTabContext } from '@/app/contexts/InvestmentTabContext'
import { useScrollHeader } from '@/app/hooks/useScrollHeader'
import { useInvestmentDetailUI } from '@/app/hooks/useInvestmentDetailUI'
import { useInvestmentDetailHandlers } from '@/app/hooks/useInvestmentDetailHandlers'
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

        <InvestmentDetailContent />

        {/* 삭제 확인 모달 */}
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      </div>
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
