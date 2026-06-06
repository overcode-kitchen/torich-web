'use client'

import { DotsThreeVertical } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SavingsCashInfoSection } from '@/app/components/SavingsCashDetailSections/SavingsCashInfoSection'
import { ProgressSection } from '@/app/components/InvestmentDetailSections/ProgressSection'
import { PaymentHistorySection } from '@/app/components/InvestmentDetailSections/PaymentHistorySection'
import { InvestmentDetailOverview } from '@/app/components/InvestmentDetailSections/InvestmentDetailOverview'
import {
  InvestmentTabProvider,
  useInvestmentTabContext,
} from '@/app/contexts/InvestmentTabContext'
import { useSavingsCashDetail } from '@/app/hooks/investment/detail/useSavingsCashDetail'
import { APP_HEADER_TOTAL_HEIGHT } from '@/app/constants/layout-constants'
import type { Investment } from '@/app/types/investment'

interface SavingsCashDetailViewProps {
  item: Investment
  onBack: () => void
  onDelete: () => Promise<void>
}

/**
 * 예적금·현금 항목 상세 화면.
 * 주식 상세(InvestmentDetailView)와 동일한 레이아웃 규약을 따른다:
 * 헤더(아바타+제목+서브) → 스티키 탭바 → 진행률 → 투자 정보 → 납입 기록.
 * 정보 행을 탭하면 토스 스타일 편집 플로우(/add?editId=...&field=...)로 진입한다.
 */
export default function SavingsCashDetailView(props: SavingsCashDetailViewProps) {
  return (
    <InvestmentTabProvider>
      <SavingsCashDetailViewInner {...props} />
    </InvestmentTabProvider>
  )
}

function SavingsCashDetailViewInner({
  item,
  onBack,
  onDelete,
}: SavingsCashDetailViewProps) {
  const router = useRouter()
  const detail = useSavingsCashDetail(item, onDelete)
  const {
    activeTab,
    handleTabClick,
    scrollContainerRef,
    overviewRef,
    titleRef,
    infoRef,
    historyRef,
  } = useInvestmentTabContext()

  const hasHistory =
    detail.paymentHistory.length > 0 || detail.retroactivePaymentHistory.length > 0

  const handleFieldTap = (field: string): void => {
    router.push(`/add?editId=${item.id}&field=${field}`)
  }

  return (
    <>
      <SubPageScaffold
        onBack={onBack}
        contentClassName="py-6"
        surfaceClassName="bg-background"
        scrollContainerRef={scrollContainerRef}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-surface-hover transition-colors"
                aria-label="메뉴"
              >
                <DotsThreeVertical className="h-6 w-6" weight="regular" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/add?editId=${item.id}`)}>
                수정하기
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => detail.setShowDeleteModal(true)}
                className="text-red-600 focus:text-red-600"
              >
                삭제하기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <div className="mx-auto max-w-md md:max-w-lg lg:max-w-2xl">
          <InvestmentDetailOverview
            item={item}
            isEditMode={false}
            completed={detail.completed}
            overviewRef={overviewRef}
            titleRef={titleRef}
            onTitleClick={() => handleFieldTap('title')}
          />

          {hasHistory && (
            <div
              className="sticky z-40 -mx-4 px-4 bg-background border-b border-border-subtle-lighter"
              style={{ top: APP_HEADER_TOTAL_HEIGHT }}
            >
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
          )}

          <ProgressSection
            progress={detail.progress}
            completed={detail.completed}
            startDate={detail.startDate}
            endDate={detail.endDate}
            isHabitMode={detail.isHabitMode}
            elapsedMonths={detail.elapsedMonths}
            totalPaidPrincipal={detail.totalPaidPrincipal}
          />

          <div className="divide-y divide-border-subtle-lighter">
            <SavingsCashInfoSection
              item={item}
              maturity={detail.maturity}
              totalPaidPrincipal={detail.totalPaidPrincipal}
              onFieldTap={handleFieldTap}
              infoRef={infoRef}
            />
            {hasHistory && (
              <PaymentHistorySection
                item={item}
                paymentHistory={detail.paymentHistory}
                retroactivePaymentHistory={detail.retroactivePaymentHistory}
                hasMorePaymentHistory={detail.hasMorePaymentHistory}
                loadMore={detail.loadMore}
                onToggleRetroactive={detail.onToggleRetroactive}
                onMarkAllRetroactive={detail.onMarkAllRetroactive}
                historyRef={historyRef}
              />
            )}
          </div>
        </div>
      </SubPageScaffold>

      <DeleteConfirmModal
        isOpen={detail.showDeleteModal}
        onClose={() => detail.setShowDeleteModal(false)}
        onConfirm={detail.handleDelete}
        isDeleting={detail.isDeleting}
        description="삭제된 적립 기록은 복구할 수 없습니다."
      />
    </>
  )
}
