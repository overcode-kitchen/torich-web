'use client'

interface InvestmentDetailActionsProps {
    handleCancel: () => void
    handleSave: () => void
    isUpdating: boolean
}

export function InvestmentDetailActions({
    handleCancel,
    handleSave,
    isUpdating,
}: InvestmentDetailActionsProps) {
    return (
        <div className="sticky bottom-0 bg-background pt-4 pb-6 px-6 -mx-6 border-t border-border-subtle-lighter">
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-secondary hover:bg-surface-strong text-foreground-soft font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                    취소
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                    {isUpdating ? '저장 중...' : '저장'}
                </button>
            </div>
        </div>
    )
}
