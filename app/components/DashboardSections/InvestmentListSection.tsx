'use client'

import Image from 'next/image'
import { CaretDown } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Investment } from '@/app/types/investment'
import InvestmentItem from '@/app/components/InvestmentItem'

type FilterStatus = 'ALL' | 'ACTIVE' | 'ENDED'
type SortBy = 'TOTAL_VALUE' | 'MONTHLY_PAYMENT' | 'NAME' | 'NEXT_PAYMENT'

export interface InvestmentListSectionProps {
  records: Investment[]
  filteredRecords: Investment[]
  filterStatus: FilterStatus
  onFilterChange: (status: FilterStatus) => void
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void
  onItemClick: (item: Investment) => void
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

export default function InvestmentListSection({
  records,
  filteredRecords,
  filterStatus,
  onFilterChange,
  sortBy,
  onSortChange,
  onItemClick,
  calculateFutureValue,
}: InvestmentListSectionProps) {
  if (records.length === 0) return null

  return (
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
  )
}
