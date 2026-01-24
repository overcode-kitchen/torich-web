'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { IconArrowLeft, IconPencil, IconTrash, IconCheck, IconX, IconInfoCircle, IconDotsVertical } from '@tabler/icons-react'
import { Investment, getStartDate, formatInvestmentDays } from '@/app/types/investment'
import InvestmentDaysPickerSheet from '@/app/components/InvestmentDaysPickerSheet'
import InvestmentEditSheet, { type RateSuggestion } from '@/app/components/InvestmentEditSheet'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { 
  calculateEndDate, 
  getElapsedText, 
  calculateProgress,
  formatFullDate,
  isCompleted
} from '@/app/utils/date'

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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // 수정 가능한 필드들
  const [editMonthlyAmount, setEditMonthlyAmount] = useState('')
  const [editPeriodYears, setEditPeriodYears] = useState('')
  const [editAnnualRate, setEditAnnualRate] = useState('')
  const [editInvestmentDays, setEditInvestmentDays] = useState<number[]>([])
  const [isDaysPickerOpen, setIsDaysPickerOpen] = useState(false)
  const [isRateManuallyEdited, setIsRateManuallyEdited] = useState(false)
  
  // 원본 수익률 저장 (비교용)
  const originalRate = item.annual_rate || 10
  const formatRate = (rate: number) => rate.toFixed(2).replace(/\.?0+$/, '')
  const rateSuggestions: RateSuggestion[] = [
    { label: '⚡️ 10년 평균 {rate}', rate: originalRate },
  ]
  const isCustomRate = !!item.is_custom_rate

  // 수정 모드 진입 시 현재 값으로 초기화
  useEffect(() => {
    if (isEditMode) {
      setEditMonthlyAmount((item.monthly_amount / 10000).toString())
      setEditPeriodYears(item.period_years.toString())
      setEditAnnualRate((item.annual_rate || 10).toString())
      setEditInvestmentDays(item.investment_days || [])
      setIsDaysPickerOpen(false)
      setIsRateManuallyEdited(false)
    }
  }, [isEditMode, item])

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
  
  // 진행 기간 텍스트
  const elapsedText = getElapsedText(startDate)
  
  // 진행률 계산
  const progress = calculateProgress(startDate, displayPeriodYears || 1)
  
  // 완료 여부
  const completed = isCompleted(startDate, displayPeriodYears || 1)

  // 숫자만 입력 허용
  const handleNumericInput = (value: string, setter: (v: string) => void) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    setter(cleaned)
  }

  // 수익률 입력 (소수점 허용)
  const handleRateInput = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '')
    // 소수점이 하나만 있도록
    const parts = cleaned.split('.')
    if (parts.length > 2) return
    setEditAnnualRate(cleaned)
    setIsRateManuallyEdited(true)
  }

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
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* 헤더 */}
      <header className="h-[52px] flex items-center justify-between px-4 bg-white sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-2 text-coolgray-700 hover:text-coolgray-900 transition-colors"
          aria-label="뒤로가기"
        >
          <IconArrowLeft className="w-6 h-6" />
        </button>

        {!isEditMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 text-coolgray-700 hover:text-coolgray-900 transition-colors"
                aria-label="메뉴"
              >
                <IconDotsVertical className="w-6 h-6" />
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
        )}
      </header>

      {/* 콘텐츠 */}
      <div className="max-w-md mx-auto px-4 pb-10">
        <div className="divide-y divide-coolgray-100">
          {/* 종목명 & 상태 */}
          <section className="py-5">
            <h2 className="text-2xl font-bold text-coolgray-900 mb-2">
              {item.title}
            </h2>
            {isEditMode ? (
              <p className="text-sm text-coolgray-400">종목명은 수정할 수 없습니다</p>
            ) : (
              <p className={`text-lg ${completed ? 'text-green-600' : 'text-brand-600'} font-semibold`}>
                {completed ? '목표 달성! 🎉' : elapsedText}
              </p>
            )}
          </section>

          {/* 진행률 - 수정 모드에서는 숨김 */}
          {!isEditMode && (
            <section className="py-5">
              <div className="flex justify-between text-sm text-coolgray-500 mb-3">
                <span className="font-medium">진행률</span>
                <span className="font-bold text-coolgray-900 text-lg">{progress}%</span>
              </div>
              <div className="w-full h-4 bg-coolgray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    completed ? 'bg-green-500' : 'bg-brand-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-coolgray-400 mt-3">
                <span>시작: {formatFullDate(startDate)}</span>
                <span>종료: {formatFullDate(endDate)}</span>
              </div>
            </section>
          )}

          {/* 만기 시 예상 금액 */}
          <section className="py-5">
            <h3 className="text-sm font-medium text-coolgray-500 mb-2">만기 시 예상 금액</h3>
            <div className="text-3xl font-bold text-coolgray-900 mb-3">
              {formatCurrency(calculatedFutureValue)}
            </div>
            <div className="inline-block bg-[#E0F8E8] text-green-600 rounded-full px-4 py-1.5 text-sm font-semibold">
              + {formatCurrency(calculatedProfit)} 수익
            </div>
          </section>

          {/* 투자 정보 / 수정 폼 */}
          <section className="py-5">
            <h3 className="text-base font-bold text-coolgray-900 mb-4">
              {isEditMode ? '투자 정보 수정' : '투자 정보'}
            </h3>
            <div className="space-y-4">
            {/* 월 투자금 */}
            <div className="flex justify-between items-center">
              <span className="text-coolgray-500">월 투자금</span>
              {isEditMode ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editMonthlyAmount}
                    onChange={(e) => handleNumericInput(e.target.value, setEditMonthlyAmount)}
                    className="w-24 text-right bg-coolgray-25 border border-coolgray-200 rounded-lg px-3 py-2 text-coolgray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="100"
                  />
                  <span className="text-coolgray-500 text-sm">만원</span>
                </div>
              ) : (
                <span className="font-semibold text-coolgray-900">
                  {formatCurrency(item.monthly_amount)}
                </span>
              )}
            </div>

            {/* 목표 기간 */}
            <div className="flex justify-between items-center">
              <span className="text-coolgray-500">목표 기간</span>
              {isEditMode ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editPeriodYears}
                    onChange={(e) => handleNumericInput(e.target.value, setEditPeriodYears)}
                    className="w-16 text-right bg-coolgray-25 border border-coolgray-200 rounded-lg px-3 py-2 text-coolgray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="10"
                  />
                  <span className="text-coolgray-500 text-sm">년</span>
                </div>
              ) : (
                <span className="font-semibold text-coolgray-900">
                  {item.period_years}년
                </span>
              )}
            </div>

            {/* 연 수익률 */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1">
                <span className="text-coolgray-500">연 수익률</span>
                {isEditMode && (
                  <div className="group relative">
                    <IconInfoCircle className="w-4 h-4 text-coolgray-400" />
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 p-2 bg-coolgray-800 text-white text-xs rounded-lg">
                      수익률을 직접 수정하면 시스템 수익률 대신 직접 입력한 값이 적용됩니다.
                    </div>
                  </div>
                )}
              </div>
              {isEditMode ? (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editAnnualRate}
                      onChange={(e) => handleRateInput(e.target.value)}
                      className="w-16 text-right bg-coolgray-25 border border-coolgray-200 rounded-lg px-3 py-2 text-coolgray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="10"
                    />
                    <span className="text-coolgray-500 text-sm">%</span>
                    {isRateManuallyEdited && parseFloat(editAnnualRate) !== originalRate && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">직접 수정</span>
                    )}
                  </div>
                  <InvestmentEditSheet
                    suggestions={rateSuggestions}
                    onSelect={(rate) => {
                      setEditAnnualRate(formatRate(rate))
                      setIsRateManuallyEdited(rate !== originalRate)
                    }}
                    className="max-w-[260px] justify-end"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-coolgray-25 text-coolgray-600 text-xs font-medium px-2.5 py-1">
                    {isCustomRate ? '직접 입력' : '10년 평균'}
                  </span>
                  <span className="font-semibold text-coolgray-900">
                    {displayAnnualRate.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            {/* 매월 투자일 */}
            <div className="flex justify-between items-start">
              <span className="text-coolgray-500">매월 투자일</span>
              {isEditMode ? (
                <div className="flex-1 ml-4">
                  {/* 선택된 날짜 표시 */}
                  <div className="flex flex-wrap gap-1 justify-end">
                    {[...editInvestmentDays].sort((a, b) => a - b).map((day) => (
                      <span
                        key={day}
                        className="inline-flex items-center gap-1 bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-xs font-medium"
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
                      className="inline-flex items-center bg-coolgray-50 text-coolgray-700 px-2 py-0.5 rounded-full text-xs font-semibold hover:bg-coolgray-100 transition-colors"
                    >
                      + 추가
                    </button>
                  </div>
                </div>
              ) : (
                <span className="font-semibold text-coolgray-900">
                  {formatInvestmentDays(item.investment_days)}
                </span>
              )}
            </div>

            <div className="border-t border-coolgray-100 my-2" />
            
            {/* 총 원금 */}
            <div className="flex justify-between items-center">
              <span className="text-coolgray-500">총 원금</span>
              <span className="font-semibold text-coolgray-900">
                {formatCurrency(totalPrincipal)}
              </span>
            </div>
            
            {/* 예상 수익 */}
            <div className="flex justify-between items-center">
              <span className="text-coolgray-500">예상 수익</span>
              <span className="font-semibold text-green-600">
                + {formatCurrency(calculatedProfit)}
              </span>
            </div>
            </div>
          </section>
        </div>

        {/* 하단 버튼 - 편집 모드에서만 */}
        {isEditMode && (
          <div className="sticky bottom-0 bg-white pt-4 pb-6">
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-coolgray-100 hover:bg-coolgray-200 text-coolgray-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                <IconX className="w-5 h-5" />
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                <IconCheck className="w-5 h-5" />
                {isUpdating ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* 오버레이 */}
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteModal(false)
              }
            }}
          />
          
          {/* 모달 컨텐츠 */}
          <div className="relative z-[60] w-full max-w-md mx-4 bg-white rounded-2xl shadow-lg p-6">
            {/* 헤더 */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-coolgray-900 mb-2">
                정말 삭제하시겠습니까?
              </h2>
              <p className="text-sm text-gray-500">
                삭제된 투자 기록은 복구할 수 없습니다.
              </p>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 text-sm font-medium text-coolgray-700 bg-coolgray-100 rounded-xl hover:bg-coolgray-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="flex-1 py-3 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

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
