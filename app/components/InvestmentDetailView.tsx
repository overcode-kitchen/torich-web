'use client'

import { useEffect } from 'react'
import { ArrowLeft, Bell, BellSlash, CalendarBlank, DotsThreeVertical } from '@phosphor-icons/react'
import { Investment } from '@/app/types/investment'
import { InvestmentTabProvider, useInvestmentTabContext } from '@/app/contexts/InvestmentTabContext'
import { useScrollHeader } from '@/app/hooks/useScrollHeader'
import { useInvestmentDetailUI } from '@/app/hooks/useInvestmentDetailUI'
import { useInvestmentDetailHandlers } from '@/app/hooks/useInvestmentDetailHandlers'
import DeleteConfirmModal from '@/app/components/DeleteConfirmModal'
import { ProgressSection } from '@/app/components/InvestmentDetailSections/ProgressSection'
import { InfoSection } from '@/app/components/InvestmentDetailSections/InfoSection'
import { PaymentHistorySection } from '@/app/components/InvestmentDetailSections/PaymentHistorySection'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatNextPaymentDate } from '@/app/utils/date'
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
    activeTab,
    scrollContainerRef,
    overviewRef,
    infoRef,
    historyRef,
    titleRef,
    handleTabClick,
  } = useInvestmentTabContext()

  const { showStickyTitle } = useScrollHeader(titleRef)

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
    handleEdit,
    handleDeleteClick,
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
  }, [isEditMode, item, investmentData.initializeFromItem])

  // 삭제 모달 열기 핸들러
  const handleDeleteModalOpen = () => {
    setShowDeleteModal(true)
  }


  // 공통 props
  const originalRate = item.annual_rate || 10
  const formatRate = (rate: number) => rate.toFixed(2).replace(/\.?0+$/, '')
  const rateSuggestions: RateSuggestion[] = [
    { label: '⚡️ 10년 평균 {rate}', rate: originalRate },
  ]
  const isCustomRate = !!item.is_custom_rate

  const infoSectionProps = {
    item,
    editMonthlyAmount: investmentData.editMonthlyAmount,
    setEditMonthlyAmount: investmentData.setEditMonthlyAmount,
    editPeriodYears: investmentData.editPeriodYears,
    setEditPeriodYears: investmentData.setEditPeriodYears,
    editAnnualRate: investmentData.editAnnualRate,
    setEditAnnualRate: investmentData.setEditAnnualRate,
    editInvestmentDays: investmentData.editInvestmentDays,
    setEditInvestmentDays: investmentData.setEditInvestmentDays,
    setIsDaysPickerOpen: setIsDaysPickerOpen,
    handleNumericInput: investmentData.handleNumericInput,
    handleRateInput: investmentData.handleRateInput,
    displayAnnualRate: investmentData.displayAnnualRate,
    totalPrincipal: investmentData.totalPrincipal,
    calculatedProfit: investmentData.calculatedProfit,
    calculatedFutureValue: investmentData.calculatedFutureValue,
    originalRate,
    isRateManuallyEdited: investmentData.isRateManuallyEdited,
    setIsRateManuallyEdited: investmentData.setIsRateManuallyEdited,
    formatRate,
    rateSuggestions,
    isCustomRate,
  }

  return (
    <div ref={scrollContainerRef} className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* 헤더 - 스크롤 시에도 종목명 고정 */}
      <header className="h-[52px] flex items-center justify-between px-6 bg-background sticky top-0 z-10 border-b border-border-subtle-lighter">
        <button
          onClick={onBack}
          className="p-2 text-foreground hover:text-foreground transition-colors -ml-1"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-6 h-6" weight="regular" />
        </button>
        {showStickyTitle && (
          <h1 className="flex-1 text-center text-base font-semibold tracking-tight text-foreground truncate mx-2">
            {item.title}
          </h1>
        )}
        {!showStickyTitle && <div className="flex-1" />}

        {!isEditMode ? (
          <div className="flex items-center -mr-1">
            <button
              type="button"
              onClick={toggleNotification}
              className="p-2 text-foreground hover:text-foreground transition-colors"
              aria-label={notificationOn ? '알림 끄기' : '알림 켜기'}
            >
              {notificationOn ? (
                <Bell className="w-6 h-6" weight="regular" />
              ) : (
                <BellSlash className="w-6 h-6 text-muted-foreground" weight="regular" />
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-2 text-foreground hover:text-foreground transition-colors"
                  aria-label="메뉴"
                >
                  <DotsThreeVertical className="w-6 h-6" weight="regular" />
                </button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[140px]">
              <DropdownMenuItem onClick={() => setIsEditMode(true)}>
                수정하기
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 focus:text-red-600"
              >
                삭제하기
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* 콘텐츠 - 좌우 24px 단일 여백, 가변 컨테이너 폭 */}
      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-6 pb-12">
        {/* 종목명 & 상태 + 다음 투자일 */}
        <section ref={overviewRef} className="py-6 space-y-4">
              <div ref={titleRef}>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                  {item.title}
                </h2>
                {isEditMode ? (
                  <p className="text-sm text-foreground-subtle">종목명은 수정할 수 없습니다</p>
                ) : (
                  completed && (
                    <p className="text-sm font-medium text-green-600">
                      목표 달성! 🎉
                    </p>
                  )
                )}
              </div>
              
              {/* 섹션 내비게이션 탭 - 제목 바로 아래에 위치, 스크롤 시 헤더 아래에 고정 */}
              <div className="sticky top-[52px] z-10 -mx-6 px-6 bg-background border-b border-border-subtle-lighter">
                <div className="flex gap-6">
                  <button
                    type="button"
                    onClick={() => handleTabClick('overview')}
                    className={`py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === 'overview'
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-foreground-subtle hover:text-foreground-soft'
                    }`}
                  >
                    개요
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabClick('info')}
                    className={`py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === 'info'
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-foreground-subtle hover:text-foreground-soft'
                    }`}
                  >
                    투자 정보
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabClick('history')}
                    className={`py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === 'history'
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-foreground-subtle hover:text-foreground-soft'
                    }`}
                  >
                    납입 기록
                  </button>
                </div>
              </div>
              {!isEditMode && nextPaymentDate && (
                <Alert className="mt-1 border-none bg-primary/10 text-foreground px-4 py-3 rounded-2xl">
                  <CalendarBlank className="w-5 h-5 text-primary" />
                  <div className="flex items-baseline justify-between gap-4 col-start-2 w-full">
                    <div>
                      <AlertTitle className="text-sm font-medium text-foreground-soft">
                        다음 투자일
                      </AlertTitle>
                      <AlertDescription className="mt-0.5 text-base font-semibold text-primary">
                        {formatNextPaymentDate(nextPaymentDate)}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
        </section>

        {/* 진행률 - 수정 모드에서는 숨김 */}
        {!isEditMode && (
          <ProgressSection
            progress={progress}
            completed={completed}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        <div className="divide-y divide-border-subtle-lighter">
          <InfoSection
            item={item}
            isEditMode={isEditMode}
            editMonthlyAmount={editMonthlyAmount}
            editPeriodYears={editPeriodYears}
            editAnnualRate={editAnnualRate}
            editInvestmentDays={editInvestmentDays}
            setEditMonthlyAmount={setEditMonthlyAmount}
            setEditPeriodYears={setEditPeriodYears}
            setEditAnnualRate={setEditAnnualRate}
            setEditInvestmentDays={setEditInvestmentDays}
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
          <div className="sticky bottom-0 bg-background pt-4 pb-6 px-6 -mx-6 border-t border-border-subtle-lighter">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-secondary hover:bg-surface-strong text-foreground-soft font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {isUpdating ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
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
