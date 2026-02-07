'use client'

import { useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CaretDown } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

/** 자석 느낌 easing: 빨리 시작해서 끝에서 끌어당기는 느낌 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** 스크롤을 목표 위치로 자석처럼 끌어당기는 애니메이션 */
function scrollToWithMagnet(
  element: HTMLElement,
  targetTop: number,
  duration = 350
) {
  const startTop = element.scrollTop
  const distance = targetTop - startTop
  if (Math.abs(distance) < 2) return

  const startTime = performance.now()

  function tick(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOutCubic(progress)
    element.scrollTop = startTop + distance * eased
    if (progress < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

function LandingPage() {
  const router = useRouter()
  const mainRef = useRef<HTMLElement>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAnimatingRef = useRef(false)

  const snapToNearestSection = useCallback(() => {
    const main = mainRef.current
    if (!main || isAnimatingRef.current) return

    const snapSections = Array.from(main.querySelectorAll('section'))
    const scrollTop = main.scrollTop
    const viewportMid = scrollTop + main.clientHeight / 2

    let targetTop: number | null = null
    let nearestDistance = Infinity

    for (const section of snapSections) {
      const sectionTop = (section as HTMLElement).offsetTop
      const sectionMid = sectionTop + (section as HTMLElement).offsetHeight / 2
      const distance = Math.abs(viewportMid - sectionMid)
      if (distance < nearestDistance) {
        nearestDistance = distance
        targetTop = sectionTop
      }
    }

    if (targetTop !== null && Math.abs(main.scrollTop - targetTop) > 5) {
      isAnimatingRef.current = true
      scrollToWithMagnet(main, targetTop)
      setTimeout(() => {
        isAnimatingRef.current = false
      }, 350)
    }
  }, [])

  useEffect(() => {
    const main = mainRef.current
    if (!main) return

    const handleScrollEnd = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(() => {
        snapToNearestSection()
        scrollTimeoutRef.current = null
      }, 120)
    }

    main.addEventListener('scroll', handleScrollEnd, { passive: true })
    return () => {
      main.removeEventListener('scroll', handleScrollEnd)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [snapToNearestSection])

  const scrollToSection2 = useCallback(() => {
    const main = mainRef.current
    const section2 = document.getElementById('landing-section-2')
    if (!main || !section2) return
    const targetTop = section2.offsetTop
    scrollToWithMagnet(main, targetTop, 450)
  }, [])

  return (
    <main
      ref={mainRef}
      className="h-dvh overflow-y-auto overflow-x-hidden snap-y snap-mandatory overscroll-y-contain bg-gradient-to-b from-surface to-white text-foreground"
    >
      {/* 모바일 앱 스타일: 화면 단위 스냅 스크롤 */}
      <div className="mx-auto flex max-w-md flex-col">
        {/* 섹션 1: 히어로 - 뷰포트 1개 */}
        <section
          className="flex h-dvh shrink-0 snap-start snap-always flex-col overflow-y-auto overflow-x-hidden px-4 pt-8"
          aria-label="토리치 소개"
        >
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
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight lg:leading-[1.1]">
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
                <p className="text-sm font-semibold text-[var(--brand-accent-text)]">토리치가 해주는 일</p>
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
                    <span className="font-semibold text-foreground">다음 투자일 알려줌!</span>
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
                    <span className="font-semibold text-foreground">납입 완료 체크!</span>
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
                      내 적립식 투자 현황 한눈에!
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

            {/* 메인 CTA + 스크롤 유도 */}
            <div className="space-y-4 pb-4 pt-2">
              <Button
                size="lg"
                className="w-full py-3.5 text-base font-semibold"
                onClick={() => router.push('/login')}
              >
                시작하기
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                계정 없이도 언제든지 나중에 다시 돌아올 수 있어요.
              </p>

              <div className="mt-2 flex items-center justify-center">
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

        {/* 섹션 2: 고민 & 해결 온보딩 - 뷰포트 1개, 자석처럼 스냅 */}
        <section
          id="landing-section-2"
          className="flex h-dvh shrink-0 snap-start snap-always flex-col overflow-y-auto overflow-x-hidden px-4 pt-10"
          style={{
            background:
              'linear-gradient(to bottom, #292A2E 0%, #292A2E 55%, #e5e2dd 85%, #f5f3f0 100%)',
          }}
          aria-label="고민 공감"
        >
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground">
                이런 고민 있지 않아?
              </h2>
              <p className="text-base text-primary-foreground/85">
                적립식 투자, 마음은 있는데
                <br />
                막상 매달 챙기는 건 쉽지 않죠.
              </p>
            </div>

            {/* 말풍선 리스트 - 온보딩 시안과 유사한 위치/레이아웃 */}
            <div className="relative mt-4 h-48">
              <div className="absolute left-1 top-0 inline-flex max-w-[260px] -rotate-6 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm">
                매달 몇 일에 넣어야 했더라...
              </div>
              <div className="absolute right-0 top-14 inline-flex max-w-[260px] rotate-4 justify-end rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm text-right">
                이번 달 빠뜨린 거 같은데...
              </div>
              <div className="absolute left-6 bottom-10 inline-flex max-w-[260px] -rotate-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm">
                내가 총 얼마나 넣었지...?
              </div>
              {/* bubblebubble.svg - 생각 이어지는 작은 구름형 (내가 총 얼마 넣었지 말풍선 아래) */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2">
                <Image
                  src="/icons/svg/bubblebubble.svg"
                  alt=""
                  width={36}
                  height={44}
                  className="opacity-90"
                  aria-hidden
                />
              </div>
            </div>
          </div>

          {/* 고민하는 토리 그래픽 - max-w-md 내에서 좌우 꽉 차게, 반응형 360~448px */}
          <div className="relative -mx-4 mt-6 flex min-h-[280px] w-[calc(100%+2rem)] items-end justify-center">
            {/* 상단→하단 그라데이션 오버레이 (0% #292A2E 100%, 44% 72%, 100% 투명) */}
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                background:
                  'linear-gradient(to bottom, #292A2E 0%, rgba(41,42,46,0.72) 44%, rgba(41,42,46,0) 100%)',
              }}
              aria-hidden
            />
            <Image
              src="/images/torich_graphic(thinking).png"
              alt="고민에 빠진 토리 - 적립식 투자를 고민하는 다람쥐 캐릭터"
              width={448}
              height={448}
              className="relative z-0 w-full min-w-0 object-contain object-bottom"
              priority
            />
          </div>
        </section>
      </div>
    </main>
  )
}

export default LandingPage

