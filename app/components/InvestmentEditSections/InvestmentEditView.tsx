'use client'

import { Check, X } from '@phosphor-icons/react'
import { useRef } from 'react'
import { InfoSection } from '@/app/components/InvestmentDetailSections/InfoSection'
import InvestmentDaysPickerSheet from '@/app/components/InvestmentDaysPickerSheet'
import type { InfoSectionProps } from '@/app/components/InvestmentDetailSections/types'
import { useInvestmentDaysPicker } from '@/app/hooks/useInvestmentDaysPicker'

interface InvestmentEditViewProps extends Omit<InfoSectionProps, 'infoRef'> {
  isUpdating: boolean
  isDaysPickerOpen: boolean
  setIsDaysPickerOpen: (open: boolean) => void
  onSave: () => void
  onCancel: () => void
}

export function InvestmentEditView({
  isUpdating,
  isDaysPickerOpen,
  setIsDaysPickerOpen,
  onSave,
  onCancel,
  ...infoSectionProps
}: InvestmentEditViewProps) {
  const infoRef = useRef<HTMLElement | null>(null)

  const daysPicker = useInvestmentDaysPicker({
    initialDays: infoSectionProps.editInvestmentDays,
    onApply: (days) => {
      infoSectionProps.setEditInvestmentDays(days)
      setIsDaysPickerOpen(false)
    },
  })

  return (
    <>
      {/* 수정 폼 섹션 */}
      <section className="py-6">
        <InfoSection
          {...infoSectionProps}
          infoRef={infoRef}
          setIsDaysPickerOpen={setIsDaysPickerOpen}
        />
      </section>

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 bg-background pt-4 pb-6 px-6">
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isUpdating}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-secondary hover:bg-surface-strong text-foreground-soft font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            취소
          </button>
          <button
            onClick={onSave}
            disabled={isUpdating}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            {isUpdating ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* 투자일 선택 바텀 시트 */}
      {isDaysPickerOpen && (
        <InvestmentDaysPickerSheet
          tempDays={daysPicker.tempDays}
          isDirty={daysPicker.isDirty}
          onToggleDay={daysPicker.toggleDay}
          onApply={daysPicker.applyChanges}
          onClose={() => {
            daysPicker.reset()
            setIsDaysPickerOpen(false)
          }}
        />
      )}
    </>
  )
}
