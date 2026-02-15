'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CaretDown } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface HeroSectionProps {
  scrollToSection2: () => void
}

export default function HeroSection({ scrollToSection2 }: HeroSectionProps) {
  const router = useRouter()

  return (
    <section
      className="relative flex h-dvh shrink-0 snap-start snap-always flex-col overflow-hidden px-4 pt-8"
      aria-label="토리치 소개"
    >
      {/* 스크롤 영역 - 콘텐츠가 버튼에 가려지지 않도록 하단 패딩 확보 */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-52">
      {/* 상단 브랜드 영역 */}
      <header className="mb-3">
        <div className="relative h-10 w-36">
          <Image
            src="/images/torich-logo.png"
            alt="토리치 로고"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
      </header>

      {/* 히어로 카피 + 그래픽 영역 */}
      <div className="flex flex-1 flex-col gap-8">
        <div className="space-y-4 pl-4 pr-4">
          <h1 className="text-[2rem] font-bold tracking-tight lg:leading-[1.1]">
            매달 투자,
            <br />
            까먹지 않게 관리해줄게
          </h1>
          <p className="text-base text-foreground-muted">
            적립식 투자를 캘린더처럼 관리해주는
            <br />
            작은 투자 동반자, 토리치예요.
          </p>
        </div>

        {/* 토리 그래픽 + 토리치가 해주는 일 카드 - 3레이어: grab(뒤) → 흰박스(중간) → grab_hand(앞) */}
        <div className="relative shrink-0">
          {/* Layer 1: grab (맨 뒤) - overlap을 컨테이너 너비의 %로 해서 반응형에 따라 비례 유지 */}
          <div className="relative z-0 flex justify-center -mb-[6%]">
            <div className="relative w-full">
              <Image
                src="/images/torich_graphic(grab).png?v=2"
                alt=""
                width={448}
                height={448}
                className="w-full object-contain object-center"
                priority
                aria-hidden
              />
            </div>
          </div>
          {/* Layer 2: 흰 박스 (중간) */}
          <div className="relative z-10 mt-0 space-y-4 rounded-3xl bg-card p-5 shadow-sm">
            <ul className="space-y-4 text-base">
              <li className="flex items-center gap-3">
                <div className="relative h-7 w-7 shrink-0">
                  <Image
                    src="/icons/3d/acorn-1.png"
                    alt="도토리 아이콘"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-semibold text-foreground">투자일 놓치지 않게 미리 알려줘요</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="relative h-7 w-7 shrink-0">
                  <Image
                    src="/icons/3d/acorn-1.png"
                    alt="도토리 아이콘"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-semibold text-foreground">이번 달 납입, 했는지 안 했는지 바로 확인</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="relative h-7 w-7 shrink-0">
                  <Image
                    src="/icons/3d/acorn-1.png"
                    alt="도토리 아이콘"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-semibold text-foreground">
                  내 적립식 투자가 얼마나 쌓였는지 한눈에
                </span>
              </li>
            </ul>
          </div>
          {/* Layer 3: grab_hand (맨 앞) - grab과 동일 가로 너비, 동일 컨테이너 기준 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
            <div className="relative w-full aspect-[800/356]">
              <div className="absolute inset-x-0 bottom-[34%] left-0 right-0 w-full">
                <Image
                  src="/images/torich_graphic(grab_hand).png"
                  alt="토리 - 적립식 투자를 관리해주는 다람쥐 캐릭터"
                  width={800}
                  height={356}
                  className="w-full object-contain object-bottom"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>

      </div>
      </div>

      {/* 하단 고정 CTA - 그라데이션 페이드 + safe area */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 flex flex-col px-4 pt-8 pb-4"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
          background:
            'linear-gradient(to top, var(--background) 40%, transparent 100%)',
        }}
      >
        <div className="space-y-4">
          <Button
            size="lg"
            className="w-full py-3.5 text-base font-semibold"
            onClick={() => router.push('/login')}
          >
            시작하기
          </Button>
          <div className="flex justify-center pb-2">
            <button
              type="button"
              className="flex flex-col items-center gap-1 text-xs text-foreground-subtle"
              aria-label="아래로 스크롤하기"
              onClick={scrollToSection2}
            >
              <span>더 알아보기</span>
              <CaretDown className="h-5 w-5 animate-bounce" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
