import { Investment, getStartDate, isHabitMode } from '@/app/types/investment';
import {
  calculateEndDate,
  calculateProgress,
  getElapsedMonths,
  getNextPaymentDate,
  isCompleted,
} from '@/app/utils/date';

interface UseInvestmentCalculationsProps {
  item: Investment;
  isEditMode: boolean;
  editMonthlyAmount: string;
  editPeriodYears: string;
  editAnnualRate: string;
  editInvestmentDays: number[];
  editIsHabitMode?: boolean;
}

export function useInvestmentCalculations({
  item,
  isEditMode,
  editMonthlyAmount,
  editPeriodYears,
  editAnnualRate,
  editInvestmentDays,
  editIsHabitMode,
}: UseInvestmentCalculationsProps) {
  const startDate = getStartDate(item);

  const displayMonthlyAmount = isEditMode
    ? parseInt(editMonthlyAmount.replace(/,/g, '') || '0') * 10000
    : item.monthly_amount;

  // 적립형 여부: 수정 모드에서는 editIsHabitMode 우선
  const habitMode = isEditMode
    ? (editIsHabitMode ?? isHabitMode(item))
    : isHabitMode(item)

  const parsedEditPeriod = parseInt(editPeriodYears || '0')
  const displayPeriodYears: number | null = isEditMode
    ? (habitMode ? null : parsedEditPeriod > 0 ? parsedEditPeriod : null)
    : (item.period_years && item.period_years > 0 ? item.period_years : null);

  const displayAnnualRate = isEditMode
    ? parseFloat(editAnnualRate || '0')
    : item.annual_rate || 10;

  const endDate = displayPeriodYears
    ? calculateEndDate(startDate, displayPeriodYears)
    : null;

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

  const nextPaymentDate = getNextPaymentDate(
    isEditMode ? editInvestmentDays : item.investment_days
  );

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
