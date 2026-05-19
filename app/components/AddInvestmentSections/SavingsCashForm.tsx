'use client'

import { CircleNotch } from '@phosphor-icons/react'
import InvestmentDaysField from './InvestmentDaysField'
import type { UseSavingsCashFormReturn } from '@/app/hooks/investment/add/useSavingsCashForm'

interface SavingsCashFormProps {
  /** 'savings'면 금리·만기일 필드를 노출한다 */
  isSavings: boolean
  form: UseSavingsCashFormReturn
  /** 매월 납입일 선택 바텀 시트 열기 */
  onOpenDaysPicker: () => void
}

/**
 * 예적금·현금 공통 입력 폼.
 * 공통 필드(이름·매달 금액·납입일) + 예적금 전용 필드(연이율·만기일).
 */
export default function SavingsCashForm({
  isSavings,
  form,
  onOpenDaysPicker,
}: SavingsCashFormProps) {
  return (
    <div className="space-y-4 mb-8">
      {/* 이름 */}
      <div>
        <label className="block text-sm font-medium text-foreground-soft mb-2">
          이름
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => form.setTitle(e.target.value)}
          placeholder={isSavings ? '예: 청년 적금' : '예: 비상금'}
          className="w-full bg-card rounded-2xl py-3.5 px-4 text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* 매달 금액 */}
      <div>
        <label className="block text-sm font-medium text-foreground-soft mb-2">
          매달 금액
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={form.monthlyAmount}
            onChange={form.handleAmountChange}
            placeholder="월 100 (만원 단위)"
            className="w-full bg-card rounded-2xl py-3.5 pl-4 pr-16 text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            만원
          </span>
        </div>
        <div className="flex flex-wrap gap-2 justify-end mt-2">
          {[10, -10, 1, -1].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => form.adjustAmount(delta)}
              className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
            >
              {delta > 0 ? `+${delta}만` : `${delta}만`}
            </button>
          ))}
        </div>
      </div>

      {/* 납입일 */}
      <InvestmentDaysField
        investmentDays={form.investmentDays}
        onOpenDaysPicker={onOpenDaysPicker}
      />

      {/* 예적금 전용: 약정 연이율 */}
      {isSavings && (
        <div>
          <label className="block text-sm font-medium text-foreground-soft mb-2">
            약정 연이율
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={form.interestRate}
              onChange={form.handleInterestRateChange}
              placeholder="예: 3.5"
              className="w-full bg-card rounded-2xl py-3.5 pl-4 pr-12 text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              %
            </span>
          </div>
        </div>
      )}

      {/* 예적금 전용: 만기일 */}
      {isSavings && (
        <div>
          <label className="block text-sm font-medium text-foreground-soft mb-2">
            만기일
          </label>
          <input
            type="date"
            value={form.maturityDate}
            onChange={(e) => form.setMaturityDate(e.target.value)}
            className="w-full bg-card rounded-2xl py-3.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {/* 저장 버튼 */}
      <button
        type="button"
        onClick={form.handleSubmit}
        disabled={form.isSubmitting}
        className="w-full bg-surface-dark text-white font-medium rounded-xl py-4 hover:bg-surface-dark-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {form.isSubmitting ? (
          <>
            <CircleNotch className="w-5 h-5 animate-spin" />
            <span>저장 중...</span>
          </>
        ) : (
          '저장하기'
        )}
      </button>
    </div>
  )
}
