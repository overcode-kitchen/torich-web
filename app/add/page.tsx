'use client'

import { Suspense } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import AddItemHeader from '@/app/components/AddItemSections/AddItemHeader'
import GroupA_WhatToSave from '@/app/components/AddItemSections/GroupA_WhatToSave'
import GroupB_HowMuch from '@/app/components/AddItemSections/GroupB_HowMuch'
import GroupC_When from '@/app/components/AddItemSections/GroupC_When'
import ExitConfirmDialog from '@/app/components/AddItemSections/ExitConfirmDialog'
import InvestmentDaysPickerSheet from '@/app/components/InvestmentDaysPickerSheet'
import ManualInputModal from '@/app/components/ManualInputModal'
import { useAddRecordPage } from '@/app/hooks/investment/add/useAddRecordPage'

function AddRecordContent() {
  const page = useAddRecordPage()
  const {
    recordType,
    effectiveRecordType,
    setRecordType,
    isEditMode,
    flow,
    formState,
    investmentForm,
    modals,
    daysPicker,
    actions,
    isSubmitting,
    handleBack,
    exitDialogOpen,
    setExitDialogOpen,
    goBackToRoot,
    onSkip,
  } = page

  return (
    <>
      <SubPageScaffold onBack={handleBack} contentClassName="py-6">
        <AddItemHeader currentGroup={flow.currentGroup} />

        {flow.currentGroup === 'A' && (
          <GroupA_WhatToSave
            recordType={recordType}
            onRecordTypeChange={setRecordType}
            investmentForm={investmentForm}
            title={formState.title}
            onTitleChange={formState.setTitle}
            onOpenManualInputModal={() => investmentForm.setIsManualModalOpen(true)}
            isEditMode={isEditMode}
          />
        )}
        {flow.currentGroup === 'B' && (
          <GroupB_HowMuch
            recordType={effectiveRecordType}
            investmentForm={investmentForm}
            formState={formState}
          />
        )}
        {flow.currentGroup === 'C' && (
          <GroupC_When
            recordType={effectiveRecordType}
            investmentForm={investmentForm}
            formState={formState}
            isStartDatePickerOpen={modals.isDatePickerOpen}
            onStartDatePickerOpenChange={modals.setIsDatePickerOpen}
            onOpenDaysPicker={() => modals.setIsDaysPickerOpen(true)}
          />
        )}

        <div className="pt-8">
          <button
            type="button"
            onClick={actions.onAction}
            disabled={!actions.canAdvance || isSubmitting}
            className="w-full bg-surface-dark text-white font-medium rounded-xl py-4 hover:bg-surface-dark-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <CircleNotch className="w-5 h-5 animate-spin" />
                <span>저장 중...</span>
              </>
            ) : (
              actions.label
            )}
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              disabled={isSubmitting}
              className="w-full py-3 mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              나중에 할게요
            </button>
          )}
        </div>
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

      <ManualInputModal
        isOpen={investmentForm.isManualModalOpen}
        onClose={investmentForm.closeAndResetManual}
        stockName={investmentForm.manualStockName}
        onStockNameChange={investmentForm.setManualStockName}
        onConfirm={() => {
          investmentForm.handleManualConfirm({
            onConfirm: (name, rate) => {
              investmentForm.setIsManualInput(true)
              investmentForm.setStockName(name)
              investmentForm.setAnnualRate(rate)
              investmentForm.setSelectedStock(null)
              investmentForm.setOriginalSystemRate(null)
              investmentForm.setRateFetchFailed(false)
              investmentForm.cancelEdit()
            },
          })
        }}
      />

      <ExitConfirmDialog
        isOpen={exitDialogOpen}
        onClose={() => setExitDialogOpen(false)}
        onConfirm={() => {
          setExitDialogOpen(false)
          goBackToRoot()
        }}
      />
    </>
  )
}

export default function AddRecordPage() {
  return (
    <Suspense fallback={null}>
      <AddRecordContent />
    </Suspense>
  )
}
