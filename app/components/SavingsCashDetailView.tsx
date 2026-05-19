'use client'

import { Trash } from '@phosphor-icons/react'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import { SavingsCashInfoSection } from '@/app/components/SavingsCashDetailSections/SavingsCashInfoSection'
import { useSavingsCashDetail } from '@/app/hooks/investment/detail/useSavingsCashDetail'
import type { Investment } from '@/app/types/investment'

interface SavingsCashDetailViewProps {
  item: Investment
  onBack: () => void
  onDelete: () => Promise<void>
}

/**
 * 예적금·현금 항목 상세 화면.
 * 투자 상세(InvestmentDetailView)와 분리되어 종목·차트 없이 핵심 정보만 보여준다.
 */
export default function SavingsCashDetailView({
  item,
  onBack,
  onDelete,
}: SavingsCashDetailViewProps) {
  const detail = useSavingsCashDetail(item, onDelete)

  return (
    <>
      <SubPageScaffold
        onBack={onBack}
        contentClassName="py-6"
        surfaceClassName="bg-background"
        actions={
          <button
            type="button"
            onClick={() => detail.setShowDeleteModal(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-subtle hover:bg-surface-hover transition-colors"
            aria-label="삭제"
          >
            <Trash className="h-5 w-5" />
          </button>
        }
      >
        <div className="mx-auto max-w-md md:max-w-lg lg:max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {item.title}
          </h2>
          <p className="mt-1 text-sm text-foreground-subtle">
            {item.record_type === 'savings' ? '예·적금' : '현금·기타'}
          </p>

          <SavingsCashInfoSection
            item={item}
            maturity={detail.maturity}
            totalPaidPrincipal={detail.totalPaidPrincipal}
          />
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
