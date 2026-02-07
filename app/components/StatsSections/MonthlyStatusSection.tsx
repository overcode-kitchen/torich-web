interface MonthlyStatusSectionProps {
  thisMonth: {
    total: number
    completed: number
  }
}

export default function MonthlyStatusSection({ thisMonth }: MonthlyStatusSectionProps) {
  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-foreground-muted mb-3">이번 달 납입 현황</h2>
      <p className="text-lg font-bold text-foreground mb-2">
        {thisMonth.total}건 중 {thisMonth.completed}건 완료
      </p>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground-soft rounded-full transition-all duration-500"
          style={{ width: thisMonth.total > 0 ? `${(thisMonth.completed / thisMonth.total) * 100}%` : '0%' }}
        />
      </div>
    </section>
  )
}
