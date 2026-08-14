'use client'

/**
 * 홈 목적 카드의 최초 로딩 골격.
 *
 * 재진입 때는 기존 카드를 그대로 두고(=깜빡임 방지), **보여줄 게 아무것도 없는 최초 진입에만** 쓴다.
 * 빈 화면 대신 골격을 두는 이유는 레이아웃 점프 때문이다 — 실제 GoalGroupCard와 같은
 * 라운드(`rounded-3xl`)·패딩(`p-6 pb-4`)·행 높이(`py-2.5`)를 써서 전환 시 아래 콘텐츠가 밀리지 않게 한다.
 */
function GoalGroupCardSkeleton() {
  return (
    <section className="overflow-hidden rounded-3xl bg-card">
      <div className="p-6 pb-4">
        {/* 헤더: 아이콘 + 목적 이름 + 진행률 */}
        <div className="mb-2 flex w-full items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-surface-hover animate-pulse" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="h-4 w-32 rounded bg-surface-hover animate-pulse" />
            <div className="h-3 w-20 rounded bg-surface-hover animate-pulse" />
          </div>
        </div>

        {/* 본문: 적립 항목 행 2개 (GoalGroupItemRow의 py-2.5와 동일) */}
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-surface-hover animate-pulse" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="h-4 w-24 rounded bg-surface-hover animate-pulse" />
                <div className="h-3 w-16 rounded bg-surface-hover animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-6 shrink-0 rounded-full bg-surface-hover animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * 목적 카드 자리의 최초 로딩 골격.
 *
 * 카드만 대신한다. 함께 놓이는 "목적 만들기" 버튼은 데이터와 무관하게 항상 같은 자리에 있고
 * 로딩 중에도 눌러도 되므로, 골격으로 가리지 않고 진짜 버튼을 그대로 그린다.
 */
export default function GoalGroupSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">목적을 불러오는 중</span>
      <GoalGroupCardSkeleton />
    </div>
  )
}
