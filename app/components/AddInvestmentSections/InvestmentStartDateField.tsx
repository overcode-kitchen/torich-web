'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CaretDown } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface InvestmentStartDateFieldProps {
    startDate: Date
    setStartDate: (date: Date) => void
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export default function InvestmentStartDateField({
    startDate,
    setStartDate,
    isOpen,
    onOpenChange,
}: InvestmentStartDateFieldProps) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground-soft px-1">
                투자 시작일
            </label>
            <Popover open={isOpen} onOpenChange={onOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-between font-normal bg-card rounded-2xl h-12 px-4 text-foreground border-border-subtle hover:bg-surface",
                            !startDate && "text-muted-foreground"
                        )}
                    >
                        {startDate ? (
                            startDate.toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })
                        ) : (
                            <span>날짜를 선택하세요</span>
                        )}
                        <CaretDown className="w-5 h-5 text-foreground-subtle" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
                    align="center"
                >
                    <Calendar
                        mode="single"
                        selected={startDate}
                        className="mx-auto"
                        onSelect={(date: Date | undefined) => {
                            if (date) {
                                setStartDate(date)
                                onOpenChange(false)
                            }
                        }}
                    />
                </PopoverContent>
            </Popover>
            <p className="text-xs text-foreground-subtle px-1">
                투자를 시작한 날짜를 선택하세요. 기본값은 오늘입니다.
            </p>
        </div>
    )
}
