import { Investment, getStartDate, isHabitMode } from '@/app/types/investment';
import {
  calculateProgress,
  getElapsedMonths,
  getNextPaymentDate,
  getRecordEndDate,
  isCompleted,
} from '@/app/utils/date';

interface UseInvestmentCalculationsProps {
  item: Investment;
}

export function useInvestmentCalculations({
  item,
}: UseInvestmentCalculationsProps) {
  const startDate = getStartDate(item);

  const displayMonthlyAmount = item.monthly_amount;

  const habitMode = isHabitMode(item)

  const displayPeriodYears: number | null =
    item.period_years && item.period_years > 0 ? item.period_years : null;

  const displayAnnualRate = item.annual_rate || 10;

  // 종료일: maturity_date(목적 마감일에 맞춘 항목/예적금)를 우선한다.
  const endDate = getRecordEndDate(item);

  // 납입 개월 수
  const elapsedMonths = getElapsedMonths(startDate);

  // 총 납입 원금 (실제 경과 기간 기반) — 적립형/목표형 공통
  const totalPaidPrincipal = displayMonthlyAmount * Math.max(0, elapsedMonths);

  const progress = displayPeriodYears
    ? calculateProgress(startDate, displayPeriodYears)
    : null;
  const completed = displayPeriodYears
    ? isCompleted(startDate, displayPeriodYears)
    : false;

  const nextPaymentDate = getNextPaymentDate(item.investment_days)

  return {
    startDate,
    displayMonthlyAmount,
    displayPeriodYears,
    displayAnnualRate,
    endDate,
    totalPaidPrincipal,
    progress,
    completed,
    isHabitMode: habitMode,
    elapsedMonths: Math.max(0, elapsedMonths),
    nextPaymentDate,
  };
}
