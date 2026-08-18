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

// 박스 크기는 그대로 두고 마스크 viewBox 여백을 줄여 얼굴 자체를 키웠다.
// 박스를 h-7 로 올려도 봤는데 행 대비 과하게 무거워져 되돌렸다.
const SIZE_CLASS: Record<RecordAvatarSize, string> = {
  sm: 'h-6 w-6 text-micro',
  lg: 'h-10 w-10 text-sm',
}

// 첫 글자 대신 아이콘이 들어갈 때(적립 종료 체크)의 크기. 박스의 약 50%로,
// 얼굴 안에 여백을 넉넉히 남겨 체크가 덜 꽉 차(덜 투박해) 보이게 한다.
const ICON_CLASS: Record<RecordAvatarSize, string> = {
  sm: 'h-3 w-3',
  lg: 'h-5 w-5',
}

// 체크를 얼굴 시각 중심으로 내리는 미세 보정. 토리 얼굴은 위쪽 귀 때문에 시각 중심이
// 기하 중심보다 살짝 아래라, 여백 있는 체크는 그대로 두면 위로 뜬 것처럼 읽힌다.
// 박스 높이의 약 5%(sm 24px 기준 +1.2px). 글자에는 적용하지 않는다.
const ICON_NUDGE_Y: Record<RecordAvatarSize, string> = {
  sm: '1.2px',
  lg: '2px',
}

/** record 없이 라벨만 있는 호출부(캘린더 등)도 같은 사이즈 규칙을 쓰도록 노출한다. */
export function getRecordAvatarSizeClass(size: RecordAvatarSize): string {
  return SIZE_CLASS[size]
}

/** 얼굴 안에 들어가는 아이콘의 사이즈별 클래스 */
export function getRecordAvatarIconSizeClass(size: RecordAvatarSize): string {
  return ICON_CLASS[size]
}

/** 적립 종료 체크를 얼굴 시각 중심으로 내리는 세로 보정값(px 문자열) */
export function getRecordAvatarIconNudgeY(size: RecordAvatarSize): string {
  return ICON_NUDGE_Y[size]
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
