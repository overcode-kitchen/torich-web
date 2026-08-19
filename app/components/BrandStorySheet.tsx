'use client'

import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBodyScrollLock } from '@/app/hooks/ui/useBodyScrollLock'

interface BrandStorySheetProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 오버레이는 body로 포털한다. 호출부가 `space-y-4` 컨테이너 안인데, Tailwind v4의
 * space-y는 v3와 달리 `:not(:last-child)`에 `margin-block-end`를 얹는다. 이 시트는
 * 마지막 자식이 아니라 `margin-bottom: 1rem`을 받고, top·bottom이 0이고 height가
 * auto인 fixed 박스는 그 마진만큼 높이가 깎여 바닥에서 16px 뜬다(#238).
 *
 * 그래서 하단 패딩을 아무리 키워도 그 16px은 닫히지 않는다 — 흰 패널 '안쪽'만 넓어질 뿐
 * 패널 바닥 모서리는 제자리다. 실기기 측정으로 확인했다(margin TB = 0px / 16px).
 * 저장소의 다른 시트(GoalActionSheet·DateSelectSheet)가 멀쩡한 이유도 포털이라
 * 형제 마진을 안 받아서다.
 */
export function BrandStorySheet({ isOpen, onClose }: BrandStorySheetProps) {
  useBodyScrollLock(isOpen)

  // 정적 export(prerender) 단계엔 document가 없다. 모든 호출부가 isOpen=false로
  // 시작하므로 이 가드로 하이드레이션 불일치 없이 서버 렌더만 건너뛴다.
  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      data-overlay
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="토리치 브랜드 스토리"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-t-3xl max-h-[80vh] max-w-md mx-auto w-full shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 mb-3 h-1 w-10 rounded-full bg-surface-strong shrink-0" />
        <ScrollArea className="flex-1 min-h-0 px-6 pb-4 pt-1">
          <div className="mb-4">
            <div className="relative w-full">
              <Image
                src="/images/torich-squirrel.png"
                alt="도토리를 모으는 토리치 람쥐 일러스트"
                width={368}
                height={460}
                className="w-full h-auto rounded-xl"
                priority
              />
            </div>
          </div>
          <h2 className="text-heading font-semibold text-foreground mb-3">
            토리치(Torich)는 &quot;(도)토리 + 리치&quot;의 합성어예요.
          </h2>
          <div className="space-y-3 text-label leading-relaxed text-foreground-soft">
            <p>
              도토리를 조금씩 모으듯, 작은 투자와 저축이 쌓여 언젠가 &quot;리치&quot;한 삶으로 이어진다는 믿음에서
              시작된 이름이에요. 한 번에 큰 결심을 요구하기보다는, 오늘 할 수 있는 가장 작고 부드러운 한 걸음을
              도와주는 투자 동반자를 지향합니다.
            </p>
            <p>
              토리치는 어려운 전문 용어보다 &quot;적립식 투자&quot;를 쉽게 시작하고, 꾸준히 이어갈 수 있게 도와주는
              서비스예요. 캘린더와 그래프, 목표 금액과 투자 기록을 통해 &quot;나는 얼마나 잘 쌓아가고 있는가&quot;를
              한눈에 확인할 수 있도록 설계했어요.
            </p>
            <div className="pt-1">
              <p className="text-foreground font-medium mb-1">우리가 사용자에게 바라는 것</p>
              <ul className="list-disc list-inside space-y-1">
                <li>단기 수익보다, 내가 원하는 삶의 속도와 방향을 먼저 떠올리기</li>
                <li>완벽한 투자자가 되기보다, 꾸준한 투자자가 되기</li>
                <li>숫자에 쫓기지 않고, 숫자를 통해 마음이 편안해지는 경험을 쌓기</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
        {/* 바닥에 붙는 시트라 하단 모서리는 깎지 않는다 — 둥글게 두면 좌우 아래 모서리로
            딤이 비친다. 하단 여백은 공용 SafeArea(:53)와 같은 calc(env + 24px)로,
            max()와 달리 safe area가 기존 24px를 잡아먹지 않아 닫기 버튼이 홈 인디케이터에
            붙지 않는다. safe area가 0인 웹에서는 24px 그대로다. */}
        <div
          className="shrink-0 px-6 pt-4 bg-card"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
        >
          <Button
            type="button"
            onClick={onClose}
            size="lg"
            className="w-full"
          >
            닫기
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
