'use client'

import SubPageScaffold from '@/app/components/SubPageScaffold'
import RecordTypeSelector from '@/app/components/AddInvestmentSections/RecordTypeSelector'
import SavingsCashForm from '@/app/components/AddInvestmentSections/SavingsCashForm'
import InvestmentDaysPickerSheet from '@/app/components/InvestmentDaysPickerSheet'
import type { RecordType } from '@/app/types/investment'
import type { UseSavingsCashFormReturn } from '@/app/hooks/investment/add/useSavingsCashForm'
import type { UseModalStateReturn } from '@/app/hooks/ui/useModalState'
import type { useInvestmentDaysPicker } from '@/app/hooks/common/useInvestmentDaysPicker'

interface SavingsCashViewProps {
  /** 'savings' | 'cash' */
  recordType: Exclude<RecordType, 'investment'>
  onRecordTypeChange: (type: RecordType) => void
  form: UseSavingsCashFormReturn
  modals: UseModalStateReturn
  daysPicker: ReturnType<typeof useInvestmentDaysPicker>
  onBack: () => void
  /** 목적 만들기 흐름일 때만 전달. "나중에 할게요"로 건너뛴다. */
  onSkip?: () => void
}

/**
 * 예적금·현금 항목 추가 화면. 상단에 유형 선택 세그먼트를 함께 노출한다.
 */
export default function SavingsCashView({
  recordType,
  onRecordTypeChange,
  form,
  modals,
  daysPicker,
  onBack,
  onSkip,
}: SavingsCashViewProps) {
  const isSavings = recordType === 'savings'

  return (
    <>
      <SubPageScaffold onBack={onBack} contentClassName="py-6">
        <div className="mb-8">
          {onSkip ? (
            <>
              <h1 className="text-xl font-bold text-foreground mb-3">
                목적을 위한 적립 항목을 추가해요
              </h1>
              <p className="text-sm text-foreground-subtle">
                이 목적에 매달 모을 항목을 정해보세요. 적금·적립식 투자 모두 좋아요.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-foreground mb-3">
                람쥐씨, 어떤 꿈을 꾸고 계신가요?
              </h1>
              <p className="text-sm text-foreground-subtle whitespace-pre-line">
                매달 꾸준히 모으는 항목을 추가해요.
              </p>
            </>
          )}
        </div>

        <RecordTypeSelector
          recordType={recordType}
          onRecordTypeChange={onRecordTypeChange}
        />

        <SavingsCashForm
          isSavings={isSavings}
          form={form}
          onOpenDaysPicker={() => modals.setIsDaysPickerOpen(true)}
        />

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={form.isSubmitting}
            className="w-full py-3 mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            나중에 할게요
          </button>
        )}
      </SubPageScaffold>

      {modals.isDaysPickerOpen && (
        <InvestmentDaysPickerSheet
          tempDays={daysPicker.tempDays}
          isDirty={daysPicker.isDirty}
          onToggleDay={daysPicker.toggleDay}
          onApply={daysPicker.applyChanges}
          onClose={() => {
            daysPicker.reset()
            modals.setIsDaysPickerOpen(false)
          }}
        />
      )}
    </>
  )
}
