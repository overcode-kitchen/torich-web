'use client'

import { useState, useEffect, useRef } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowLeft,
  Pencil,
  Trash,
  Check,
  X,
  Info,
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
  // refs (기존 유지)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const overviewRef = useRef<HTMLElement | null>(null)
  const infoRef = useRef<HTMLElement | null>(null)
  const historyRef = useRef<HTMLElement | null>(null)
  const titleRef = useRef<HTMLDivElement>(null)

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
  const [activeTab, setActiveTab] = useState<'overview' | 'info' | 'history'>('overview')
  const [visiblePaymentMonths, setVisiblePaymentMonths] = useState(6)
  const [showStickyTitle, setShowStickyTitle] = useState(false)
  
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

  // 종목 변경 시 월별 납입 페이징 초기화
  useEffect(() => {
    setVisiblePaymentMonths(6)
  }, [item.id])

  // 스크롤 시 종목명 고정 감지
  useEffect(() => {
    if (!titleRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyTitle(!entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '-52px 0px 0px 0px', // 헤더 높이만큼 여유
      }
    )

    observer.observe(titleRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  // 시작일 추출
  const startDate = getStartDate(item)
  
  // 현재 표시할 값들 (수정 모드에서는 수정 중인 값, 아니면 원본)
  const displayMonthlyAmount = isEditMode 
    ? (parseInt(editMonthlyAmount.replace(/,/g, '') || '0') * 10000) 
    : item.monthly_amount
  const displayPeriodYears = isEditMode 
    ? parseInt(editPeriodYears || '0') 
    : item.period_years
  const displayAnnualRate = isEditMode 
    ? parseFloat(editAnnualRate || '0') 
    : (item.annual_rate || 10)
  
  const endDate = calculateEndDate(startDate, displayPeriodYears || 1)
  
  // 연이율
  const R = displayAnnualRate / 100
  
  // 만기 시점 미래 가치 계산
  const calculatedFutureValue = calculateFutureValue(
    displayMonthlyAmount,
    displayPeriodYears || 1,
    displayPeriodYears || 1,
    R
  )
  
  // 총 원금 계산
  const totalPrincipal = displayMonthlyAmount * 12 * (displayPeriodYears || 1)
  
  // 수익금 계산
  const calculatedProfit = calculatedFutureValue - totalPrincipal
  
  // 진행률 계산
  const progress = calculateProgress(startDate, displayPeriodYears || 1)
  
  // 완료 여부
  const completed = isCompleted(startDate, displayPeriodYears || 1)
  
  // 다음 투자일
  const nextPaymentDate = getNextPaymentDate(
    isEditMode ? editInvestmentDays : item.investment_days
  )
  
  // 투자 히스토리 (시작일부터) - 해당 월의 모든 납입일이 완료된 경우에만 완료로 표시
  const fullPaymentHistory = getPaymentHistoryFromStart(
    item.id,
    item.investment_days ?? undefined,
    item.start_date ?? item.created_at ?? undefined,
    item.period_years
  )
  const paymentHistory = fullPaymentHistory.slice(0, visiblePaymentMonths)
  const hasMorePaymentHistory = visiblePaymentMonths < fullPaymentHistory.length


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

  const handleTabClick = (tab: 'overview' | 'info' | 'history') => {
    setActiveTab(tab)
    const container = scrollContainerRef.current
    if (!container) return

    const target =
      tab === 'overview'
        ? overviewRef.current
        : tab === 'info'
          ? infoRef.current
          : historyRef.current

    if (!target) return

    const headerAndTabsHeight = 52 + 40 // header(52) + tabs 영역 약간의 높이
    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const currentScrollTop = container.scrollTop
    const offset = targetRect.top - containerRect.top + currentScrollTop - headerAndTabsHeight

    container.scrollTo({ top: offset, behavior: 'smooth' })
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

      {/* 콘텐츠 - 좌우 24px 단일 여백 */}
      <div className="max-w-md mx-auto px-6 pb-12">
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
          <section className="py-6 border-b border-border-subtle-lighter">
            <div className="flex justify-between text-base text-muted-foreground mb-3">
              <span className="font-medium">진행률</span>
              <span className="font-bold text-foreground">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  completed ? 'bg-green-500' : 'bg-brand-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-foreground-subtle mt-3">
              <span>시작: {formatFullDate(startDate)}</span>
              <span>종료: {formatFullDate(endDate)}</span>
            </div>
          </section>
        )}

        <div className="divide-y divide-border-subtle-lighter">
          {/* 투자 정보 / 수정 폼 */}
          <section ref={infoRef} className="py-6">
              <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
                {isEditMode ? '투자 정보 수정' : '투자 정보'}
              </h3>
              <div className="space-y-6">
              {/* 월 투자금 */}
              {isEditMode ? (
                <div className="space-y-1.5">
                  <label className="block text-foreground font-bold text-base">월 투자금</label>
                  <InputWithUnit
                    value={editMonthlyAmount}
                    onChange={(e) => handleNumericInput(e.target.value, setEditMonthlyAmount)}
                    placeholder="100"
                    unit="만원"
                  />
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">월 투자금</span>
                  <span className="text-base font-semibold text-foreground">
                    {formatCurrency(item.monthly_amount)}
                  </span>
                </div>
              )}

            {/* 목표 기간 */}
            {isEditMode ? (
              <div className="space-y-1.5">
                <label className="block text-foreground font-bold text-base">목표 기간</label>
                <InputWithUnit
                  value={editPeriodYears}
                  onChange={(e) => handleNumericInput(e.target.value, setEditPeriodYears)}
                  placeholder="10"
                  unit="년"
                />
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">목표 기간</span>
                <span className="text-base font-semibold text-foreground">
                  {item.period_years}년
                </span>
              </div>
            )}

            {/* 연 수익률 */}
            {isEditMode ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="block text-foreground font-bold text-base">연 수익률</label>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-foreground-subtle" aria-hidden />
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 p-2 bg-surface-dark text-white text-xs rounded-lg z-10">
                      수익률을 직접 수정하면 시스템 수익률 대신 직접 입력한 값이 적용됩니다.
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <InputWithUnit
                      value={editAnnualRate}
                      onChange={(e) => handleRateInput(e.target.value)}
                      placeholder="10"
                      unit="%"
                    />
                    {isRateManuallyEdited && parseFloat(editAnnualRate) !== originalRate && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">직접 수정</span>
                    )}
                  </div>
                  <div className="flex justify-end w-full">
                    <InvestmentEditSheet
                      suggestions={rateSuggestions}
                      onSelect={(rate) => {
                        setEditAnnualRate(formatRate(rate))
                        setIsRateManuallyEdited(rate !== originalRate)
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">연 수익률</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-surface text-foreground-muted text-xs font-medium px-2.5 py-1">
                    {isCustomRate ? '직접 입력' : '10년 평균'}
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {displayAnnualRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            )}

            {/* 매월 투자일 */}
            {isEditMode ? (
              <div className="space-y-1.5">
                <label className="block text-foreground font-bold text-base">
                  매월 투자일
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[...editInvestmentDays].sort((a, b) => a - b).map((day) => (
                    <span
                      key={day}
                      className="inline-flex items-center gap-1 bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)] px-2 py-0.5 rounded-full text-xs font-medium"
                    >
                      {day}일
                      <button
                        type="button"
                        onClick={() => setEditInvestmentDays(prev => prev.filter(d => d !== day))}
                        className="hover:text-brand-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsDaysPickerOpen(true)}
                    className="inline-flex items-center bg-surface-hover text-foreground-soft px-2 py-0.5 rounded-full text-xs font-semibold hover:bg-secondary transition-colors"
                  >
                    + 추가
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">매월 투자일</span>
                <span className="text-base font-semibold text-foreground">
                  {formatInvestmentDays(item.investment_days)}
                </span>
              </div>
            )}

            <div className="border-t border-border-subtle-lighter my-2" />
            
            {/* 총 원금 */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">총 원금</span>
              <span className="text-base font-semibold text-foreground">
                {formatCurrency(totalPrincipal)}
              </span>
            </div>
            
            {/* 예상 수익 */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">예상 수익</span>
              <span className="text-base font-semibold text-foreground">
                + {formatCurrency(calculatedProfit)}
              </span>
            </div>

            {/* 만기 시 예상 금액 */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">만기 시 예상 금액</span>
              <span className="text-base font-semibold text-foreground">
                {formatCurrency(calculatedFutureValue)}
              </span>
            </div>
              </div>
            </section>

            {/* 월별 납입 기록 - 하단 배치, 시작일부터, 페이징 */}
            {!isEditMode && fullPaymentHistory.length > 0 && (
              <section ref={historyRef} className="py-6">
                <h3 className="text-lg font-semibold tracking-tight text-foreground mb-3">월별 납입 기록</h3>
                <div className="overflow-x-auto rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-foreground-muted font-semibold text-sm">월</TableHead>
                        <TableHead className="text-foreground-muted font-semibold text-sm">투자일</TableHead>
                        <TableHead className="text-foreground-muted font-semibold text-sm">납입 금액</TableHead>
                        <TableHead className="text-foreground-muted font-semibold text-sm">상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map(({ monthLabel, yearMonth, completed: monthCompleted }) => (
                        <TableRow key={yearMonth} className="border-border-subtle">
                          <TableCell className="font-medium text-foreground text-sm">
                            {yearMonth.replace('-', '.')}
                          </TableCell>
                          <TableCell className="text-foreground-muted text-sm">
                            {item.investment_days && item.investment_days.length > 0
                              ? [...item.investment_days].sort((a, b) => a - b).map((d) => {
                                  const [y, m] = yearMonth.split('-')
                                  return `${y}.${m}.${String(d).padStart(2, '0')}`
                                }).join(', ')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-foreground-muted text-sm">
                            {formatCurrency(item.monthly_amount)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {monthCompleted ? (
                              <span className="text-green-600 font-medium" title="해당 월 납입 완료됨">✓ 완료됨</span>
                            ) : (
                              <span className="text-red-500 font-medium" title="해당 월 납입 미완료">✗ 미완료</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {hasMorePaymentHistory && (
                  <button
                    type="button"
                    onClick={() => setVisiblePaymentMonths((prev) => prev + 10)}
                    className="mt-3 w-full py-2.5 text-sm font-medium text-foreground-muted bg-surface-hover hover:bg-secondary rounded-lg transition-colors"
                  >
                    이어서 보기
                  </button>
                )}
              </section>
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
