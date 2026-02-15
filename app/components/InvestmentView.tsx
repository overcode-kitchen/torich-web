'use client'

import { ProgressSection } from '@/app/components/InvestmentDetailSections/ProgressSection'
import { InfoSection } from '@/app/components/InvestmentDetailSections/InfoSection'
import { PaymentHistorySection } from '@/app/components/InvestmentDetailSections/PaymentHistorySection'
import InvestmentViewHeader from '@/app/components/InvestmentViewSections/InvestmentViewHeader'
import InvestmentViewOverview from '@/app/components/InvestmentViewSections/InvestmentViewOverview'
import type { Investment } from '@/app/types/investment'
import type { InfoSectionProps } from '@/app/components/InvestmentDetailSections/types'

interface InvestmentViewProps {
  item: Investment
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  notificationOn: boolean
  toggleNotification: () => void
  progress: number
  completed: boolean
  startDate: Date
  endDate: Date
  nextPaymentDate: Date | null
  paymentHistory: Array<{ monthLabel: string; yearMonth: string; completed: boolean }>
  hasMorePaymentHistory: boolean
  loadMore: () => void
  infoSectionProps: Omit<InfoSectionProps, 'isEditMode' | 'infoRef'>
  overviewRef: React.RefObject<HTMLElement>
  infoRef: React.RefObject<HTMLElement>
  historyRef: React.RefObject<HTMLElement>
  showStickyTitle: boolean
  titleRef: React.RefObject<HTMLDivElement>
}

export function InvestmentView({
  item,
  onBack,
  onEdit,
  onDelete,
  notificationOn,
  toggleNotification,
  progress,
  completed,
  startDate,
  endDate,
  nextPaymentDate,
  paymentHistory,
  hasMorePaymentHistory,
  loadMore,
  infoSectionProps,
  overviewRef,
  infoRef,
  historyRef,
  showStickyTitle,
  titleRef,
}: InvestmentViewProps) {
  return (
    <>
      <InvestmentViewHeader
        title={item.title}
        showStickyTitle={showStickyTitle}
        notificationOn={notificationOn}
        onBack={onBack}
        onEdit={onEdit}
        onDelete={onDelete}
        toggleNotification={toggleNotification}
      />

      <div className="max-w-md mx-auto px-6 pb-12">
        <InvestmentViewOverview
          title={item.title}
          completed={completed}
          nextPaymentDate={nextPaymentDate}
          overviewRef={overviewRef}
          titleRef={titleRef}
        />

        {/* 진행률 */}
        <ProgressSection
          progress={progress}
          completed={completed}
          startDate={startDate}
          endDate={endDate}
        />

        <div className="divide-y divide-border-subtle-lighter">
          <InfoSection
            {...infoSectionProps}
            isEditMode={false}
            infoRef={infoRef as any}
            setIsDaysPickerOpen={() => { }}
          />

          {paymentHistory.length > 0 && (
            <PaymentHistorySection
              item={item}
              paymentHistory={paymentHistory}
              hasMorePaymentHistory={hasMorePaymentHistory}
              loadMore={loadMore}
              historyRef={historyRef}
            />
          )}
        </div>
      </div>
    </>
  )
}
