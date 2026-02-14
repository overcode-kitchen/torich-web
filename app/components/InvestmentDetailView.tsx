'use client'

import { useState, useEffect, useRef } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowLeft,
  Pencil,
  Trash,
  Check,
  X,
  DotsThreeVertical,
  Bell,
  BellSlash,
  CalendarBlank,
} from '@phosphor-icons/react'
import { Investment, getStartDate, formatInvestmentDays } from '@/app/types/investment'
import InvestmentDaysPickerSheet from '@/app/components/InvestmentDaysPickerSheet'
import InvestmentEditSheet, { type RateSuggestion } from '@/app/components/InvestmentEditSheet'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { InputWithUnit } from '@/components/ui/input-with-unit'
import { 
  calculateEndDate, 
  calculateProgress,
  formatFullDate,
  formatNextPaymentDate,
  getNextPaymentDate,
  isCompleted
} from '@/app/utils/date'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getPaymentHistoryFromStart } from '@/app/utils/payment-history'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useNotificationToggle } from '@/app/hooks/useNotificationToggle'
import { useInvestmentDetailEdit } from '@/app/hooks/useInvestmentDetailEdit'
import { useInvestmentTabs } from '@/app/hooks/useInvestmentTabs'
import { usePaymentPagination } from '@/app/hooks/usePaymentPagination'
import { useScrollHeader } from '@/app/hooks/useScrollHeader'
import { useInvestmentCalculations } from '@/app/hooks/useInvestmentCalculations'
import { ProgressSection } from '@/app/components/InvestmentDetailSections/ProgressSection'
import { InfoSection } from '@/app/components/InvestmentDetailSections/InfoSection'
import { PaymentHistorySection } from '@/app/components/InvestmentDetailSections/PaymentHistorySection'
import DeleteConfirmModal from '@/app/components/DeleteConfirmModal'

interface UpdateData {
  monthly_amount: number
  period_years: number
  annual_rate: number
  investment_days?: number[]
}

interface InvestmentDetailViewProps {
  item: Investment
  onBack: () => void
  onUpdate: (data: UpdateData) => Promise<void>
  onDelete: () => Promise<void>
  isDeleting?: boolean
  isUpdating?: boolean
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

export default function InvestmentDetailView({
  item,
  onBack,
  onUpdate,
  onDelete,
  isDeleting = false,
  isUpdating = false,
  calculateFutureValue,
}: InvestmentDetailViewProps) {
  // 훅들
  const {
    activeTab,
    scrollContainerRef,
    overviewRef,
    infoRef,
    historyRef,
    handleTabClick,
  } = useInvestmentTabs();

  const { showStickyTitle, titleRef } = useScrollHeader();

  // 알림 훅
  const { notificationOn, toggleNotification } = useNotificationToggle(item.id)

  // 수정 폼 훅
  const {
    editMonthlyAmount, setEditMonthlyAmount,
    editPeriodYears, setEditPeriodYears,
    editAnnualRate, setEditAnnualRate,
    editInvestmentDays, setEditInvestmentDays,
    isRateManuallyEdited, setIsRateManuallyEdited,
    handleNumericInput, handleRateInput,
    initializeFromItem,
  } = useInvestmentDetailEdit()

  // UI 상태 (컴포넌트에 유지)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDaysPickerOpen, setIsDaysPickerOpen] = useState(false)

  const {
    startDate,
    displayMonthlyAmount,
    displayPeriodYears,
    displayAnnualRate,
    endDate,
    calculatedFutureValue,
    totalPrincipal,
    calculatedProfit,
    progress,
    completed,
    nextPaymentDate,
  } = useInvestmentCalculations({
    item,
    isEditMode,
    editMonthlyAmount,
    editPeriodYears,
    editAnnualRate,
    editInvestmentDays,
    calculateFutureValue,
  });

  const fullPaymentHistory = getPaymentHistoryFromStart(
    item.id,
    item.investment_days ?? undefined,
    item.start_date ?? item.created_at ?? undefined,
    item.period_years
  );

  const { paymentHistory, hasMorePaymentHistory, loadMore } = usePaymentPagination(
    fullPaymentHistory,
    item.id
  );
  
  // 원본 수익률 저장 (비교용)
  const originalRate = item.annual_rate || 10
  const formatRate = (rate: number) => rate.toFixed(2).replace(/\.?0+$/, '')
  const rateSuggestions: RateSuggestion[] = [
    { label: '⚡️ 10년 평균 {rate}', rate: originalRate },
  ]
  const isCustomRate = !!item.is_custom_rate

  // 수정 모드 진입 시 초기화 (기존 useEffect 대체)
  useEffect(() => {
    if (isEditMode) {
      initializeFromItem(item)
      setIsDaysPickerOpen(false)
    }
  }, [isEditMode, item, initializeFromItem])




  // 저장
  const handleSave = async () => {
    const monthlyAmountInWon = parseInt(editMonthlyAmount.replace(/,/g, '') || '0') * 10000
    const periodYears = parseInt(editPeriodYears || '0')
    const annualRate = parseFloat(editAnnualRate || '0')

    if (monthlyAmountInWon <= 0 || periodYears <= 0 || annualRate <= 0) {
      alert('모든 값을 올바르게 입력해주세요.')
      return
    }

    await onUpdate({
      monthly_amount: monthlyAmountInWon,
      period_years: periodYears,
      annual_rate: annualRate,
      investment_days: editInvestmentDays.length > 0 ? editInvestmentDays : undefined,
    })
    setIsEditMode(false)
  }

  // 취소
  const handleCancel = () => {
    setIsEditMode(false)
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
            handleNumericInput={handleNumericInput}
            handleRateInput={handleRateInput}
            displayAnnualRate={displayAnnualRate}
            totalPrincipal={totalPrincipal}
            calculatedProfit={calculatedProfit}
            calculatedFutureValue={calculatedFutureValue}
            originalRate={originalRate}
            isRateManuallyEdited={isRateManuallyEdited}
            setIsRateManuallyEdited={setIsRateManuallyEdited}
            formatRate={formatRate}
            rateSuggestions={rateSuggestions}
            isCustomRate={isCustomRate}
            infoRef={infoRef}
          />

            {!isEditMode && fullPaymentHistory.length > 0 && (
            <PaymentHistorySection
              item={item}
              paymentHistory={paymentHistory}
              hasMorePaymentHistory={hasMorePaymentHistory}
              loadMore={loadMore}
              historyRef={historyRef}
            />
          )}
          </div>

        {/* 하단 버튼 - 편집 모드에서만 */}
        {isEditMode && (
          <div className="sticky bottom-0 bg-background pt-4 pb-6 px-6">
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-secondary hover:bg-surface-strong text-foreground-soft font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
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
        onConfirm={onDelete}
        isDeleting={isDeleting}
      />

      {/* 투자일 선택 바텀 시트 */}
      {isEditMode && isDaysPickerOpen && (
        <InvestmentDaysPickerSheet
          days={editInvestmentDays}
          onClose={() => setIsDaysPickerOpen(false)}
          onApply={(days) => {
            setEditInvestmentDays(days)
            setIsDaysPickerOpen(false)
          }}
        />
      )}

    </div>
  )
}
