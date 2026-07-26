import { cn } from '@/lib/utils'
import { getRecordAvatar, type RecordAvatarSize } from '@/app/utils/recordAvatar'
import { getWiggleStyle } from '@/app/utils/wiggle'
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
  /** 적립 항목. 라벨·시장별 색을 여기서 계산한다. */
  record?: Pick<Investment, 'title' | 'market' | 'record_type'>
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

  const resolvedLabel = label ?? avatar?.label ?? '?'
  const resolvedBg = bgClassName ?? avatar?.bgClassName ?? 'bg-coolgray-50'
  const resolvedText = textClassName ?? avatar?.textClassName ?? 'text-coolgray-700'
  const sizeClassName = avatar?.sizeClassName ?? (size === 'lg' ? 'h-10 w-10 text-sm' : 'h-6 w-6 text-[11px]')

  // 종목명(없으면 라벨)으로 박자를 정해 서로 다른 리듬으로 뒤뚱거리게 한다.
  const wiggleStyle = wiggle
    ? getWiggleStyle(`${record?.title ?? label ?? resolvedLabel}${record?.market ?? ''}`)
    : undefined

  return (
    <div
      className={cn('relative shrink-0', sizeClassName, wiggle && 'animate-tory-nudge', className)}
      style={wiggleStyle}
      aria-hidden
    >
      <div className={cn('absolute inset-0', resolvedBg)} style={TORY_FACE_MASK} />
      {/* 얼굴 실루엣을 따라가는 은은한 외곽선. 마스크와 같은 viewBox·정렬이라 정확히 겹친다.
          보더 색은 글자색과 같은 톤(currentColor)을 낮은 투명도로 써서 배경색 변형(초록·파랑·회색)에 자동으로 맞춘다.
          non-scaling-stroke 로 사이즈와 무관하게 약 1px 두께를 유지한다. */}
      <svg
        viewBox={TORY_FACE_MASK_VIEWBOX}
        className={cn('absolute inset-0 h-full w-full', resolvedText)}
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
        {resolvedLabel}
      </span>
    </div>
  )
}
