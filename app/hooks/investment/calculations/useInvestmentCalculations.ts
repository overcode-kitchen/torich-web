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
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number;
}

/**
 * 시뮬레이션(적립형)용 복리 계산
 *  - 기간/만기 구분 없이 T년 동안 매월 납입 + 월복리
 */
function simulateHabitValue(monthlyAmount: number, years: number, R: number): number {
  if (years <= 0 || monthlyAmount <= 0) return 0
  const monthlyRate = R / 12
  const totalMonths = years * 12
  if (monthlyRate === 0) return monthlyAmount * totalMonths
  return (
    monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
  )
}

export function useInvestmentCalculations({
  item,
  isEditMode,
  editMonthlyAmount,
  editPeriodYears,
  editAnnualRate,
  editInvestmentDays,
  editIsHabitMode,
  calculateFutureValue,
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
  const R = displayAnnualRate / 100;

  // 납입 개월 수
  const elapsedMonths = getElapsedMonths(startDate);

  // 총 납입액 (실제 경과 기간 기반) — 적립형/목표형 공통
  const totalPaidPrincipal = displayMonthlyAmount * Math.max(0, elapsedMonths);

  // 만기 가치 (목표형) 또는 "현재 시점 예상 자산" (적립형)
  let calculatedFutureValue: number;
  let totalPrincipal: number;
  if (habitMode || !displayPeriodYears) {
    // 적립형: 오늘까지 경과 기간 기준 예상 자산
    const elapsedYears = Math.max(0, elapsedMonths) / 12;
    calculatedFutureValue = simulateHabitValue(displayMonthlyAmount, elapsedYears, R);
    totalPrincipal = totalPaidPrincipal;
  } else {
    // 목표형: 만기 가치 & 만기 총 원금
    calculatedFutureValue = calculateFutureValue(
      displayMonthlyAmount,
      displayPeriodYears,
      displayPeriodYears,
      R
    );
    totalPrincipal = displayMonthlyAmount * 12 * displayPeriodYears;
  }

  const calculatedProfit = calculatedFutureValue - totalPrincipal;
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
    R,
    calculatedFutureValue,
    totalPrincipal,
    totalPaidPrincipal,
    calculatedProfit,
    progress,
    completed,
    isHabitMode: habitMode,
    elapsedMonths: Math.max(0, elapsedMonths),
    nextPaymentDate,
  };
}
