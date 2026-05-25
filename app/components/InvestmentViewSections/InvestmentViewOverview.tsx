'use client'

interface InvestmentViewOverviewProps {
  title: string
  completed: boolean
  overviewRef: React.RefObject<HTMLElement>
  titleRef: React.RefObject<HTMLDivElement>
}

export default function InvestmentViewOverview({
  title,
  completed,
  overviewRef,
  titleRef,
}: InvestmentViewOverviewProps) {
  return (
    <section ref={overviewRef} className="py-6 space-y-4">
      <div ref={titleRef}>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
          {title}
        </h2>
        {completed && (
          <p className="text-sm font-medium text-green-600">
            목표 달성! 🎉
          </p>
        )}
      </div>

      {/* 섹션 내비게이션 탭 */}
      <div className="sticky top-[52px] z-40 -mx-6 px-6 bg-background border-b border-border-subtle-lighter">
        <div className="flex gap-6">
          <button
            type="button"
            className="py-3 text-sm font-medium transition-colors border-b-2 border-foreground text-foreground"
          >
            개요
          </button>
          <button
            type="button"
            className="py-3 text-sm font-medium transition-colors border-b-2 border-transparent text-foreground-subtle hover:text-foreground-soft"
          >
            투자 정보
          </button>
          <button
            type="button"
            className="py-3 text-sm font-medium transition-colors border-b-2 border-transparent text-foreground-subtle hover:text-foreground-soft"
          >
            납입 기록
          </button>
        </div>
      </div>
    </section>
  )
}
