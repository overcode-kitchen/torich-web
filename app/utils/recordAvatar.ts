import { getRecordType } from '@/app/types/investment'
import { getInvestmentAvatarLabel } from './investmentAvatarLabel'
import type { Investment } from '@/app/types/investment'

export type RecordAvatarSize = 'sm' | 'lg'

export interface RecordAvatar {
  /** 아바타에 표시할 라벨 (이름 첫 글자) */
  label: string
  /** 아바타 배경·글자 색 클래스 */
  className: string
  /** 사이즈별 박스 클래스 (가로/세로/글자크기) */
  sizeClassName: string
}

const SIZE_CLASS: Record<RecordAvatarSize, string> = {
  sm: 'h-6 w-6 text-[11px]',
  lg: 'h-10 w-10 text-sm',
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
  const type = getRecordType(record)
  const label = getInvestmentAvatarLabel(record.title)
  const sizeClassName = SIZE_CLASS[size]

  if (type === 'investment') {
    return {
      label,
      sizeClassName,
      className:
        record.market === 'US'
          ? 'bg-blue-100 text-blue-600'
          : 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)]',
    }
  }

  // 예적금·현금: 중립 색 (투자 아바타 톤과 무게감 맞춤)
  return {
    label,
    sizeClassName,
    className: 'bg-coolgray-50 text-coolgray-700',
  }
}
