'use client'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { NameLabel } from '@/app/components/design-system/DesignSystemShared'

const SAMPLE_AMOUNT = 500_000

/** 홈 대시보드 — 다가오는 투자 행과 동일한 마크업·클래스 (정적 미리보기) */
function UpcomingRowPreview() {
    return (
        <div>
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-2 py-2.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                            <div
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-600"
                                aria-hidden
                            >
                                테
                            </div>
                            <h3 className="min-w-0 truncate text-base font-semibold text-foreground">테슬라</h3>
                        </div>
                        <div className="pl-2">
                            <p className="truncate text-sm text-muted-foreground">4/25 (토)</p>
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-bold tabular-nums text-foreground">
                        {formatCurrency(SAMPLE_AMOUNT)}
                    </span>
                    <Button type="button" variant="soft" size="xs" className="pointer-events-none shrink-0 px-3" tabIndex={-1}>
                        완료하기
                    </Button>
                </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-2 py-2.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                            <div
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-accent-bg)] text-[11px] font-semibold text-[var(--brand-accent-text)]"
                                aria-hidden
                            >
                                삼
                            </div>
                            <h3 className="min-w-0 truncate text-base font-semibold text-foreground">삼성전자</h3>
                        </div>
                        <div className="pl-2">
                            <p className="truncate text-sm text-muted-foreground">4/28 (월)</p>
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(300_000)}</span>
                    <Button type="button" variant="soft" size="xs" className="pointer-events-none shrink-0 px-3" tabIndex={-1}>
                        완료하기
                    </Button>
                </div>
            </div>
        </div>
    )
}

function InvestmentRowBlock({
    title,
    initial,
    usMarket,
    subline,
    badge,
}: {
    title: string
    initial: string
    usMarket: boolean
    subline: string
    badge: string
}) {
    return (
        <div className="relative overflow-hidden border-b border-border-subtle last:border-b-0">
            <div className="relative bg-card py-1 select-none">
                <div className="w-full rounded-2xl px-2 py-2.5 text-left transition-colors">
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                            <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                                    usMarket
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)]'
                                }`}
                            >
                                {initial}
                            </div>
                            <h3 className="min-w-0 truncate text-base font-semibold text-foreground">{title}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pl-2">
                            <p className="text-sm text-muted-foreground">{subline}</p>
                            <span className="inline-flex items-center rounded-full bg-surface px-1.5 py-px text-[10px] font-medium text-foreground-subtle">
                                {badge}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/** 홈 대시보드 — 내 투자 목록 행과 동일한 패딩·타이포 (스와이프 제외 정적 미리보기) */
function InvestmentRowPreview() {
    return (
        <div>
            <InvestmentRowBlock
                title="테슬라"
                initial="테"
                usMarket
                subline={`월 ${formatCurrency(SAMPLE_AMOUNT)} · 매월 25일`}
                badge="목표 적립"
            />
            <InvestmentRowBlock
                title="삼성전자"
                initial="삼"
                usMarket={false}
                subline={`월 ${formatCurrency(300_000)} · 매월 5일`}
                badge="자유 적립"
            />
        </div>
    )
}

export function DashboardListRowsPatternSection() {
    return (
        <section className="space-y-6">
            <div>
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">대시보드 · 투자 행</h2>
                <p className="mt-2 text-base text-muted-foreground">
                    다가오는 투자와 내 투자 목록의 행 패딩·구분선을 나란히 비교합니다. 실제 홈과 동일한 클래스를 사용합니다.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-3">
                    <NameLabel label="다가오는 투자 · 행" token="pattern-dashboard-upcoming-row" />
                    <div className="rounded-3xl bg-card p-6 pb-4 shadow-sm ring-1 ring-border-subtle">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            카드 내부 (p-6)
                        </p>
                        <UpcomingRowPreview />
                    </div>
                </div>
                <div className="space-y-3">
                    <NameLabel label="내 투자 목록 · 행" token="pattern-dashboard-investment-row" />
                    <div className="rounded-3xl bg-card p-6 pb-4 shadow-sm ring-1 ring-border-subtle">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            카드 내부 (p-6)
                        </p>
                        <InvestmentRowPreview />
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">레이아웃 요약 (정렬 시 참고)</p>
                <ul className="mt-3 list-inside list-disc space-y-1.5">
                    <li>
                        <span className="text-foreground">공통</span>: 행 구분{' '}
                        <code className="text-xs text-foreground-muted">border-b border-border-subtle last:border-b-0</code>
                        , 종목명{' '}
                        <code className="text-xs text-foreground-muted">h3 text-base font-semibold</code>
                    </li>
                    <li>
                        <span className="text-foreground">다가오는 투자</span>: 행 컨테이너{' '}
                        <code className="text-xs text-foreground-muted">px-2 py-2.5</code>
                    </li>
                    <li>
                        <span className="text-foreground">내 투자 목록</span>: 바깥 래퍼{' '}
                        <code className="text-xs text-foreground-muted">py-1</code> + 클릭 영역{' '}
                        <code className="text-xs text-foreground-muted">px-2 py-2.5 rounded-2xl</code> (스와이프·호버용)
                    </li>
                </ul>
            </div>
        </section>
    )
}
