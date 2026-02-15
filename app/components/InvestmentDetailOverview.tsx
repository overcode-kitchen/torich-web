'use client'

import { CalendarBlank } from '@phosphor-icons/react'
import { Investment } from '@/app/types/investment'
import { useInvestmentTabContext } from '@/app/contexts/InvestmentTabContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatNextPaymentDate } from '@/app/utils/date'

interface InvestmentDetailOverviewProps {
    item: Investment
    isEditMode: boolean
    nextPaymentDate: Date | null
    completed: boolean
}

export function InvestmentDetailOverview({
    item,
    isEditMode,
    nextPaymentDate,
    completed,
}: InvestmentDetailOverviewProps) {
    const {
        activeTab,
        overviewRef,
        titleRef,
        handleTabClick,
    } = useInvestmentTabContext()

    return (
        <section ref={overviewRef} className="py-6 space-y-4">
            <div ref={titleRef}>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                    {item.title}
                </h2>
                {isEditMode ? (
                    <p className="text-sm text-foreground-subtle">종목명은 수정할 수 없습니다</p>
                ) : (
                    completed && (
                        <p className="text-sm font-medium text-green-600">
                            목표 달성! 🎉
                        </p>
                    )
                )}
            </div>

            {/* 섹션 내비게이션 탭 - 제목 바로 아래에 위치, 스크롤 시 헤더 아래에 고정 */}
            <div className="sticky top-[52px] z-10 -mx-6 px-6 bg-background border-b border-border-subtle-lighter">
                <div className="flex gap-6">
                    <button
                        type="button"
                        onClick={() => handleTabClick('overview')}
                        className={`py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview'
                                ? 'border-foreground text-foreground'
                                : 'border-transparent text-foreground-subtle hover:text-foreground-soft'
                            }`}
                    >
                        개요
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabClick('info')}
                        className={`py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'info'
                                ? 'border-foreground text-foreground'
                                : 'border-transparent text-foreground-subtle hover:text-foreground-soft'
                            }`}
                    >
                        투자 정보
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabClick('history')}
                        className={`py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history'
                                ? 'border-foreground text-foreground'
                                : 'border-transparent text-foreground-subtle hover:text-foreground-soft'
                            }`}
                    >
                        납입 기록
                    </button>
                </div>
            </div>
            {!isEditMode && nextPaymentDate && (
                <Alert className="mt-1 border-none bg-primary/10 text-foreground px-4 py-3 rounded-2xl">
                    <CalendarBlank className="w-5 h-5 text-primary" />
                    <div className="flex items-baseline justify-between gap-4 col-start-2 w-full">
                        <div>
                            <AlertTitle className="text-sm font-medium text-foreground-soft">
                                다음 투자일
                            </AlertTitle>
                            <AlertDescription className="mt-0.5 text-base font-semibold text-primary">
                                {formatNextPaymentDate(nextPaymentDate)}
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
            )}
        </section>
    )
}
