import { Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import {
  getRecordAvatar,
  getRecordAvatarIconSizeClass,
  getRecordAvatarIconNudgeY,
  getRecordAvatarSizeClass,
  type RecordAvatarSize,
} from '@/app/utils/recordAvatar'
import { getWiggleStyle } from '@/app/utils/wiggle'
import { isContributionEnded, type ContributionEndInput } from '@/app/utils/contribution-end'
import type { Investment } from '@/app/types/investment'
import { TORY_FACE_MASK_PATH, TORY_FACE_MASK_VIEWBOX } from './toryFaceMaskPath'

/** 토리 얼굴 실루엣 마스크 (배경색을 얼굴 모양으로 잘라낸다) */
const TORY_FACE_MASK: React.CSSProperties = {
  maskImage: 'url(/icons/tory-face-mask.svg)',
  maskSize: 'contain',
  maskRepeat: 'no-repeat',
  maskPosition: 'center',
  WebkitMaskImage: 'url(/icons/tory-face-mask.svg)',
  WebkitMaskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
}

export interface RecordAvatarProps {
  /**
   * 적립 항목. 라벨·시장별 색을 여기서 계산한다.
   * 적립 종료 판정에 쓰는 기간·정산 필드까지 함께 받는다 — 없으면 끝난 항목을
   * 진행 중처럼 보여주게 되므로, 부분 객체를 넘기는 호출부는 타입에서 막는다.
   */
  record?: Pick<Investment, 'title' | 'market' | 'record_type'> & ContributionEndInput
  size?: RecordAvatarSize
  /** record 없이 종목 첫 글자만 있을 때 (캘린더 event 전용) */
  label?: string
  /** 배경색 클래스 강제 지정 (예: 완료·미룸 상태 회색) */
  bgClassName?: string
  /** 글자색 클래스 강제 지정 */
  textClassName?: string
  /** 제자리에서 가끔 한 번씩 꿈틀거리는 애니메이션. 종목마다 다른 박자라 화면에서 뜸하게 한두 개만 움직인다. (기본 on) */
  wiggle?: boolean
  className?: string
}

/**
 * 적립 항목 아바타 — 토리 얼굴 실루엣 안에 이름 첫 글자를 표시한다.
 * 시장별 배경색(미국 파랑·국내 브랜드액센트·현금 회색)을 얼굴 모양으로 마스킹한다.
 * 인라인으로 중복되던 원형 아바타를 한 곳으로 통일한 공통 컴포넌트.
 *
 * 적립이 끝난 항목(적금 만기·정산, 투자·현금의 적립 기간 종료)은 첫 글자 대신
 * **그린 filled + 체크**로 바꿔 "이건 다 됐다"를 색과 아이콘으로 선언한다.
 * 판정은 `isContributionEnded` 하나만 쓰므로 아바타를 쓰는 모든 화면이 같은 기준으로 읽힌다.
 */
export function RecordAvatar({
  record,
  size = 'sm',
  label,
  bgClassName,
  textClassName,
  wiggle = true,
  className,
}: RecordAvatarProps) {
  const avatar = record ? getRecordAvatar(record, size) : null
  const isEnded = record ? isContributionEnded(record) : false

  const resolvedLabel = label ?? avatar?.label ?? '?'
  // 종료 상태는 유형별 색을 덮되, 호출부가 명시한 색(캘린더의 완료·미룸 회색)에는 양보한다.
  const resolvedBg = bgClassName ?? (isEnded ? 'bg-primary' : avatar?.bgClassName) ?? 'bg-coolgray-50'
  const resolvedText =
    textClassName ?? (isEnded ? 'text-primary-foreground' : avatar?.textClassName) ?? 'text-coolgray-700'
  const sizeClassName = avatar?.sizeClassName ?? getRecordAvatarSizeClass(size)

  // 끝난 항목은 꿈틀거림을 멈춘다 — 계속 움직이면 아직 진행 중인 것으로 읽힌다.
  const isWiggling = wiggle && !isEnded
  // 종목명(없으면 라벨)으로 박자를 정해 서로 다른 리듬으로 뒤뚱거리게 한다.
  const wiggleStyle = isWiggling
    ? getWiggleStyle(`${record?.title ?? label ?? resolvedLabel}${record?.market ?? ''}`)
    : undefined

  return (
    <div
      className={cn(
        'relative shrink-0',
        sizeClassName,
        isWiggling && 'animate-tory-nudge',
        className,
      )}
      style={wiggleStyle}
      aria-hidden
    >
      <div className={cn('absolute inset-0', resolvedBg)} style={TORY_FACE_MASK} />
      {/* 얼굴 실루엣을 따라가는 은은한 외곽선. 마스크와 같은 viewBox·정렬이라 정확히 겹친다.
          보더 색은 글자색과 같은 톤(currentColor)을 낮은 투명도로 써서 배경색 변형(초록·파랑·회색)에 자동으로 맞춘다.
          non-scaling-stroke 로 사이즈와 무관하게 약 1px 두께를 유지한다.
          마스크 여백이 얇아(24px 기준 0.65px) stroke 바깥쪽 절반이 뷰포트 가장자리에 닿을 수 있으므로
          overflow-visible 로 잘림을 막는다. */}
      <svg
        viewBox={TORY_FACE_MASK_VIEWBOX}
        className={cn('absolute inset-0 h-full w-full overflow-visible', resolvedText)}
        fill="none"
      >
        <path
          d={TORY_FACE_MASK_PATH}
          stroke="currentColor"
          strokeOpacity={0.22}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center font-semibold leading-none',
          resolvedText,
        )}
      >
        {isEnded ? (
          // 얼굴 시각 중심(귀 때문에 기하 중심보다 아래)으로 살짝 내려 정렬한다.
          <Check
            className={getRecordAvatarIconSizeClass(size)}
            weight="bold"
            style={{ transform: `translateY(${getRecordAvatarIconNudgeY(size)})` }}
          />
        ) : (
          resolvedLabel
        )}
      </span>
    </div>
  )
}
