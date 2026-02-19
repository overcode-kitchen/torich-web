import { Investment, getStartDate } from '@/app/types/investment';
import {
  calculateEndDate,
  calculateProgress,
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
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number;
}

export function useInvestmentCalculations({
  item,
  isEditMode,
  editMonthlyAmount,
  editPeriodYears,
  editAnnualRate,
  editInvestmentDays,
  calculateFutureValue,
}: UseInvestmentCalculationsProps) {
  const startDate = getStartDate(item);

  const displayMonthlyAmount = isEditMode
    ? parseInt(editMonthlyAmount.replace(/,/g, '') || '0') * 10000
    : item.monthly_amount;

  const displayPeriodYears = isEditMode
    ? parseInt(editPeriodYears || '0')
    : item.period_years;

  const displayAnnualRate = isEditMode
    ? parseFloat(editAnnualRate || '0')
    : item.annual_rate || 10;

  const endDate = calculateEndDate(startDate, displayPeriodYears || 1);
  const R = displayAnnualRate / 100;

  const calculatedFutureValue = calculateFutureValue(
    displayMonthlyAmount,
    displayPeriodYears || 1,
    displayPeriodYears || 1,
    R
  );

  const totalPrincipal = displayMonthlyAmount * 12 * (displayPeriodYears || 1);
  const calculatedProfit = calculatedFutureValue - totalPrincipal;
  const progress = calculateProgress(startDate, displayPeriodYears || 1);
  const completed = isCompleted(startDate, displayPeriodYears || 1);

  const nextPaymentDate = getNextPaymentDate(
    isEditMode ? editInvestmentDays : item.investment_days
  );

  return {
    startDate,
    displayMonthlyAmount,
    displayPeriodYears,
    displayAnnualRate,
    endDate,
    R,
    calculatedFutureValue,
    totalPrincipal,
    calculatedProfit,
    progress,
    completed,
    nextPaymentDate,
  };
}
