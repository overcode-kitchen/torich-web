'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CaretDown, Plus, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Investment } from '@/app/types/investment'
import InvestmentItem from '@/app/components/InvestmentItem'
import UpcomingInvestments from '@/app/components/UpcomingInvestments'
import { formatCurrency } from '@/lib/utils'

type FilterStatus = 'ALL' | 'ACTIVE' | 'ENDED'

type SortBy = 'TOTAL_VALUE' | 'MONTHLY_PAYMENT' | 'NAME' | 'NEXT_PAYMENT'

export interface DashboardProps {
  records: Investment[]
  filteredRecords: Investment[]
  activeRecords: Investment[]
  totalMonthlyPayment: number

  filterStatus: FilterStatus
  onFilterChange: (status: FilterStatus) => void
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void

  showMonthlyAmount: boolean
  onToggleMonthlyAmount: () => void

  onItemClick: (item: Investment) => void

  showBrandStoryCard: boolean
  onCloseBrandStoryCard: () => void
  isBrandStoryOpen: boolean
  onOpenBrandStory: () => void
  onCloseBrandStory: () => void

  showRateUpdateToast: boolean

  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

export default function Dashboard({
  records,
  filteredRecords,
  activeRecords,
  totalMonthlyPayment,
  filterStatus,
  onFilterChange,
  sortBy,
  onSortChange,
  showMonthlyAmount,
  onToggleMonthlyAmount,
  onItemClick,
  showBrandStoryCard,
  onCloseBrandStoryCard,
  isBrandStoryOpen,
  onOpenBrandStory,
  onCloseBrandStory,
  showRateUpdateToast,
  calculateFutureValue,
}: DashboardProps) {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-surface">
      {/* 수익률 갱신 완료 토스트 */}
      {showRateUpdateToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg flex items-center gap-2">
            <span className="text-lg">🐿️</span>
            <span className="text-sm text-foreground-soft">지난달 시장 데이터를 반영하여 예측을 업데이트했어요!</span>
          </div>
        </div>
      )}

      {/* 상단 헤더 */}
      <header className="h-[52px] flex items-center justify-between px-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">티끌모아 태산</h1>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* 다가오는 투자 섹션 */}
        {activeRecords.length > 0 && <UpcomingInvestments records={activeRecords} />}

        {/* 투자 목록 추가하기 버튼 (btn-primary-cta: primary + size-lg) */}
        <Button
          size="lg"
          className="w-full rounded-2xl"
          onClick={() => router.push('/add')}
        >
          <Plus className="w-5 h-5" />
          투자 목록 추가하기
        </Button>

        {/* 이번 달 투자금액 (금액만 가리기 가능) */}
        {records.length > 0 && totalMonthlyPayment > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-card-border bg-card px-4 py-3">
            <p className="text-sm font-medium text-muted-foreground">이번 달 투자금액</p>
            <div className="flex items-center gap-2">
              {showMonthlyAmount ? (
                <span className="text-base font-semibold text-foreground">
                  {formatCurrency(totalMonthlyPayment)}
                </span>
              ) : (
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4].map((i) => (
                    <Image
                      key={i}
                      src="/icons/3d/coin-front.png"
                      alt=""
                      width={28}
                      height={28}
                      className="w-7 h-7"
                    />
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={onToggleMonthlyAmount}
                className="text-muted-foreground hover:text-foreground-soft hover:bg-secondary h-auto py-1 px-2"
              >
                {showMonthlyAmount ? '가리기' : '보기'}
              </Button>
            </div>
          </div>
        )}

        {/* 브랜드 스토리 - 텍스트만 보이고 바텀시트로 바로 오픈 (닫으면 메인에서 숨김) */}
        {showBrandStoryCard && (
          <div className="w-full flex items-center justify-between rounded-2xl bg-card px-4 py-3 border border-card-border">
            <button
              type="button"
              onClick={onOpenBrandStory}
              className="flex-1 flex flex-col items-start text-left"
            >
              <span className="text-foreground font-medium">토리치가 궁금하다면</span>
              <span className="text-sm text-muted-foreground mt-0.5">
                이름에 담긴 의미와 우리가 추구하는 방향을 소개해요.
              </span>
            </button>
            <button
              type="button"
              onClick={onCloseBrandStoryCard}
              className="ml-2 p-1 text-foreground-subtle hover:text-foreground-soft transition-colors"
              aria-label="브랜드 스토리 카드 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 브랜드 스토리 바텀시트 (홈) */}
        {isBrandStoryOpen && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="토리치 브랜드 스토리"
            onClick={onCloseBrandStory}
          >
            <div
              className="bg-card rounded-t-3xl max-h-[80vh] max-w-md mx-auto w-full shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mt-3 mb-3 h-1 w-10 rounded-full bg-surface-strong shrink-0" />
              <div className="flex-1 overflow-y-auto scrollbar-thin px-6 pb-4 pt-1 min-h-0">
                <div className="mb-4">
                  <div className="relative w-full">
                    <Image
                      src="/images/torich-squirrel.png"
                      alt="도토리를 모으는 토리치 람쥐 일러스트"
                      width={368}
                      height={460}
                      className="w-full h-auto rounded-xl"
                      priority
                    />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  토리치(Torich)는 &quot;(도)토리 + 리치&quot;의 합성어예요.
                </h2>
                <div className="space-y-3 text-sm leading-relaxed text-foreground-soft">
                  <p>
                    도토리를 조금씩 모으듯, 작은 투자와 저축이 쌓여 언젠가 &quot;리치&quot;한 삶으로 이어진다는
                    믿음에서 시작된 이름이에요. 한 번에 큰 결심을 요구하기보다는, 오늘 할 수 있는 가장 작고 부드러운
                    한 걸음을 도와주는 투자 동반자를 지향합니다.
                  </p>
                  <p>
                    토리치는 어려운 전문 용어보다 &quot;적립식 투자&quot;를 쉽게 시작하고, 꾸준히 이어갈 수 있게
                    도와주는 서비스예요. 캘린더와 그래프, 목표 금액과 투자 기록을 통해 &quot;나는 얼마나 잘 쌓아가고
                    있는가&quot;를 한눈에 확인할 수 있도록 설계했어요.
                  </p>
                  <div className="pt-1">
                    <p className="text-foreground font-medium mb-1">우리가 사용자에게 바라는 것</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>단기 수익보다, 내가 원하는 삶의 속도와 방향을 먼저 떠올리기</li>
                      <li>완벽한 투자자가 되기보다, 꾸준한 투자자가 되기</li>
                      <li>숫자에 쫓기지 않고, 숫자를 통해 마음이 편안해지는 경험을 쌓기</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="shrink-0 px-6 pb-6 pt-4 bg-card rounded-b-3xl">
                <Button type="button" onClick={onCloseBrandStory} size="lg" className="w-full">
                  닫기
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 내 투자 목록 카드 */}
        {records.length > 0 ? (
          <div className="bg-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold tracking-tight text-foreground mb-4 flex items-center gap-1">
              <Image
                src="/icons/3d/piggy bank.png"
                alt="내 투자 목록 아이콘"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span>내 투자 목록</span>
            </h2>

            {/* 필터 및 정렬 컨트롤 바 */}
            <div className="flex items-center justify-between mb-4 gap-2">
              {/* 필터 칩 */}
              <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
                <button
                  onClick={() => onFilterChange('ALL')}
                  className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                    filterStatus === 'ALL'
                      ? 'bg-surface-dark text-white font-medium'
                      : 'bg-surface text-foreground-muted hover:bg-surface-hover font-normal'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => onFilterChange('ACTIVE')}
                  className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                    filterStatus === 'ACTIVE'
                      ? 'bg-surface-dark text-white font-medium'
                      : 'bg-surface text-foreground-muted hover:bg-surface-hover font-normal'
                  }`}
                >
                  진행 중
                </button>
                <button
                  onClick={() => onFilterChange('ENDED')}
                  className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                    filterStatus === 'ENDED'
                      ? 'bg-surface-dark text-white font-medium'
                      : 'bg-surface text-foreground-muted hover:bg-surface-hover font-normal'
                  }`}
                >
                  종료
                </button>
              </div>

              {/* 정렬 드롭다운 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                    {sortBy === 'TOTAL_VALUE' && '평가금액 순'}
                    {sortBy === 'MONTHLY_PAYMENT' && '월 투자액 순'}
                    {sortBy === 'NAME' && '이름 순'}
                    {sortBy === 'NEXT_PAYMENT' && '다음 투자일 순'}
                    <CaretDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[140px]">
                  <DropdownMenuItem onClick={() => onSortChange('TOTAL_VALUE')}>평가금액 순</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSortChange('MONTHLY_PAYMENT')}>월 투자액 순</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSortChange('NAME')}>이름 순</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSortChange('NEXT_PAYMENT')}>다음 투자일 순</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((item: Investment) => (
                  <InvestmentItem
                    key={item.id}
                    item={item}
                    onClick={() => onItemClick(item)}
                    calculateFutureValue={calculateFutureValue}
                  />
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-foreground-subtle text-sm">
                    {filterStatus === 'ACTIVE' && '진행 중인 투자가 없습니다'}
                    {filterStatus === 'ENDED' && '종료된 투자가 없습니다'}
                    {filterStatus === 'ALL' && '투자가 없습니다'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-card rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6">
            <p className="text-muted-foreground text-lg">아직 등록된 투자가 없어요</p>
            <Button
              size="lg"
              className="rounded-2xl shadow-lg"
              onClick={() => router.push('/add')}
            >
              <Plus className="w-5 h-5" />
              투자 목록 추가하기
            </Button>
          </div>
        )}

        {/* 통계 보기 링크 - 예상 자산·수익 차트는 /stats에서 */}
        {records.length > 0 && (
          <Link
            href="/stats"
            className="block text-center py-3 text-sm text-muted-foreground hover:text-foreground-soft transition-colors"
          >
            예상 자산 · 수익 차트 보기 →
          </Link>
        )}
      </div>
    </main>
  )
}
