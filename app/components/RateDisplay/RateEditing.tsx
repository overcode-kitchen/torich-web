'use client'

interface RateEditingProps {
    editingRate: string
    onRateChange: (value: string) => void
    onConfirmEdit: () => void
    onCancelEdit: () => void
    isManualInput: boolean
}

export default function RateEditing({
    editingRate,
    onRateChange,
    onConfirmEdit,
    onCancelEdit,
    isManualInput,
}: RateEditingProps) {
    // Manual input and selected stock editing share the same structure but slightly different styles/buttons if needed.
    // Based on the original code, they are very similar.
    // Manual Input version uses `bg-primary` for confirm button, others use `bg-brand-600`.
    // Refactoring to unify or keep distinct if logical.

    // Checking original code:
    // Selected Stock Editing:
    // - bg-brand-600 text-white (Confirm)
    // - bg-surface-strong text-foreground-soft (Cancel)

    // Manual Input Editing:
    // - bg-primary text-primary-foreground (Confirm)
    // - bg-surface-strong text-foreground-soft (Cancel)

    // Since `bg-brand-600` is often `primary` in many systems, but here might be distinct.
    // To preserve exact behavior, I will use a conditional class for the confirm button.

    const confirmBtnClass = isManualInput
        ? "px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        : "px-3 py-1 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"

    return (
        <div className="flex items-center gap-2 bg-surface-hover rounded-xl p-3">
            <span className="text-sm text-foreground-muted">연 수익률</span>
            <input
                type="text"
                value={editingRate}
                onChange={(e) => onRateChange(e.target.value)}
                className="w-16 text-center bg-card border border-border rounded-lg px-2 py-1 text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="10"
                autoFocus
            />
            <span className="text-sm text-foreground-muted">%</span>
            <button
                type="button"
                onClick={onConfirmEdit}
                className={confirmBtnClass}
            >
                확인
            </button>
            <button
                type="button"
                onClick={onCancelEdit}
                className="px-3 py-1 bg-surface-strong text-foreground-soft text-sm font-medium rounded-lg hover:bg-surface-strong-hover transition-colors"
            >
                취소
            </button>
        </div>
    )
}
