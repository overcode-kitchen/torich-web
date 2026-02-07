'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface BrandStorySheetProps {
  isOpen: boolean
  onClose: () => void
}

export function BrandStorySheet({ isOpen, onClose }: BrandStorySheetProps) {
  if (!isOpen) return null

  return (
    <div
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
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 pb-4 pt-1 min-h-0">
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
          <h2 className="text-lg font-semibold text-foreground mb-3">
            토리치(Torich)는 &quot;(도)토리 + 리치&quot;의 합성어예요.
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-foreground-soft">
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
        </div>
        <div className="shrink-0 px-6 pb-6 pt-4 bg-card rounded-b-3xl">
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
    </div>
  )
}
