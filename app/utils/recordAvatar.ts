import { getRecordType } from '@/app/types/investment'
import { getInvestmentAvatarLabel } from './investmentAvatarLabel'
import type { Investment } from '@/app/types/investment'

export type RecordAvatarSize = 'sm' | 'lg'

export interface RecordAvatar {
  /** 아바타에 표시할 라벨 (이름 첫 글자) */
  label: string
  /** 아바타 배경·글자 색 클래스 (배경/글자 합본, 원형 렌더용) */
  className: string
  /** 배경색 클래스만 (토리 얼굴 마스크 레이어용) */
  bgClassName: string
  /** 글자색 클래스만 (라벨 오버레이용) */
  textClassName: string
  /** 사이즈별 박스 클래스 (가로/세로/글자크기) */
  sizeClassName: string
}

const SIZE_CLASS: Record<RecordAvatarSize, string> = {
  sm: 'h-6 w-6 text-[11px]',
  lg: 'h-10 w-10 text-sm',
}

/** 유형·시장별 배경/글자 색 클래스 */
function getAvatarColors(
  record: Pick<Investment, 'market' | 'record_type'>,
): { bgClassName: string; textClassName: string } {
  const type = getRecordType(record)

  if (type === 'investment') {
    return record.market === 'US'
      ? { bgClassName: 'bg-blue-100', textClassName: 'text-blue-600' }
      : {
          bgClassName: 'bg-[var(--brand-accent-bg)]',
          textClassName: 'text-[var(--brand-accent-text)]',
        }
  }

  // 예적금·현금: 중립 색 (투자 아바타 톤과 무게감 맞춤)
  return { bgClassName: 'bg-coolgray-50', textClassName: 'text-coolgray-700' }
}

/**
 * 적립 항목 유형에 맞는 아바타 라벨·색을 계산한다.
 * - 투자(미국): 파랑 / 투자(국내): 브랜드 액센트
 * - 예적금·현금: 종목이 없으므로 중립 색 + 이름 첫 글자
 */
export function getRecordAvatar(
  record: Pick<Investment, 'title' | 'market' | 'record_type'>,
  size: RecordAvatarSize = 'sm',
): RecordAvatar {
  const label = getInvestmentAvatarLabel(record.title)
  const sizeClassName = SIZE_CLASS[size]
  const { bgClassName, textClassName } = getAvatarColors(record)

  return {
    label,
    bgClassName,
    textClassName,
    className: `${bgClassName} ${textClassName}`,
    sizeClassName,
  }
}
