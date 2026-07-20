'use client'

import { Bell, BellSlash, DotsThreeVertical } from '@phosphor-icons/react'
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
import { DetailTabs } from '@/app/components/Common/DetailTabs'
import {
  InvestmentTabProvider,
  useInvestmentTabContext,
} from '@/app/contexts/InvestmentTabContext'
import { useSavingsCashDetail } from '@/app/hooks/investment/detail/useSavingsCashDetail'
import { useScrollHeader } from '@/app/hooks/ui/useScrollHeader'
import { useNotificationToggle } from '@/app/hooks/notification/useNotificationToggle'
import { useGlobalNotification } from '@/app/hooks/notification/useGlobalNotification'
import { cn } from '@/lib/utils'
import type { Investment } from '@/app/types/investment'

interface SavingsCashDetailViewProps {
  item: Investment
  onBack: () => void
  onDelete: () => Promise<void>
}

/**
 * 예적금·현금 항목 상세 화면.
 * 주식 상세(InvestmentDetailView)와 동일한 레이아웃 규약을 따른다:
 * 헤더(아바타+제목+서브) → 스티키 탭바 → 진행률 → 적립 정보 → 납입 기록.
 * 정보 행을 탭하면 토스 스타일 편집 플로우(/add?editId=...&field=...)로 진입한다.
 */
export default function SavingsCashDetailView(props: SavingsCashDetailViewProps) {
  return (
    <InvestmentTabProvider initialTab="info">
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
  const { notificationOn, toggleNotification } = useNotificationToggle(item.id)
  const { notificationOn: isGlobalNotificationOn } = useGlobalNotification()
  const isNotificationDisabled = !isGlobalNotificationOn
  const {
    activeTab,
    handleTabClick,
    scrollContainerRef,
    overviewRef,
    titleRef,
    infoRef,
    historyRef,
  } = useInvestmentTabContext()

  // 제목이 스크롤로 사라지면 헤더 중앙에 스티키 제목을 띄운다(주식 상세와 동일 규약).
  const { showStickyTitle } = useScrollHeader(titleRef)

  const hasHistory =
    detail.paymentHistory.length > 0 || detail.retroactivePaymentHistory.length > 0

  const handleFieldTap = (field: string): void => {
    router.push(`/add?editId=${item.id}&field=${field}`)
  }

  return (
    <>
      <SubPageScaffold
        onBack={onBack}
        contentClassName="px-6 py-6"
        surfaceClassName="bg-background"
        scrollContainerRef={scrollContainerRef}
        centerSlot={
          showStickyTitle ? (
            <h1 className="truncate text-center text-base font-semibold tracking-tight text-foreground">
              {item.title}
            </h1>
          ) : undefined
        }
        actions={
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleNotification}
              disabled={isNotificationDisabled}
              aria-disabled={isNotificationDisabled}
              aria-label={notificationOn ? '알림 끄기' : '알림 켜기'}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-surface-hover transition-colors',
                isNotificationDisabled &&
                  'text-foreground-subtle cursor-not-allowed hover:bg-transparent',
              )}
            >
              {notificationOn ? (
                <Bell className="h-6 w-6" weight="regular" />
              ) : (
                <BellSlash className="h-6 w-6 text-muted-foreground" weight="regular" />
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-surface-hover transition-colors"
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
                  className="text-destructive focus:text-destructive"
                >
                  삭제하기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      >
        {/* 폭 제약·가운데 정렬은 SubPageScaffold 본문 컨테이너가 담당한다(중복 max-width 제거). */}
        <InvestmentDetailOverview
          item={item}
          isEditMode={false}
          completed={detail.completed}
          overviewRef={overviewRef}
          titleRef={titleRef}
          onTitleClick={() => handleFieldTap('title')}
        />

        <ProgressSection
          progress={detail.progress}
          completed={detail.completed}
          startDate={detail.startDate}
          endDate={detail.endDate}
          isHabitMode={detail.isHabitMode}
          elapsedMonths={detail.elapsedMonths}
          totalPaidPrincipal={detail.totalPaidPrincipal}
        />

        {hasHistory && (
          <DetailTabs
            tabs={[
              { key: 'info', label: '적립 정보' },
              { key: 'history', label: '납입 기록' },
            ]}
            activeTab={activeTab}
            onTabClick={(tab) => handleTabClick(tab as typeof activeTab)}
            bleedClassName="-mx-6 px-6"
          />
        )}

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
