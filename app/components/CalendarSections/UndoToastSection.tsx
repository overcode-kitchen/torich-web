interface UndoToastSectionProps {
  pendingUndo: boolean
  handleUndo: () => void
  /** 왼쪽 문구. 회차가 여럿이면 "10일 완료됨"처럼 대상 회차를 명시한다. 기본 "완료됨". */
  label?: string
}

export function UndoToastSection({ pendingUndo, handleUndo, label = '완료됨' }: UndoToastSectionProps) {
  if (!pendingUndo) return null

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-xl bg-surface-dark text-white px-4 py-3 shadow-lg"
      role="status"
    >
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={handleUndo}
        className="text-sm font-semibold text-brand-300 hover:text-brand-200 transition-colors"
      >
        되돌리기
      </button>
    </div>
  )
}
