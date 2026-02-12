'use client'

import { useRef } from 'react'
import { useLandingScroll } from '@/app/hooks/useLandingScroll'
import HeroSection from './LandingPageSections/HeroSection'
import ConcernSection from './LandingPageSections/ConcernSection'

function LandingPage() {
  const mainRef = useRef<HTMLElement>(null)
  const { scrollToSection2 } = useLandingScroll(mainRef)

  return (
    <main
      ref={mainRef}
      className="h-dvh overflow-y-auto overflow-x-hidden snap-y snap-mandatory overscroll-y-contain bg-gradient-to-b from-surface to-white text-foreground"
    >
      {/* 모바일 앱 스타일: 화면 단위 스냅 스크롤 */}
      <div className="mx-auto flex max-w-md flex-col">
        {/* 섹션 1: 히어로 - 뷰포트 1개 */}
        <HeroSection scrollToSection2={scrollToSection2} />

        {/* 섹션 2: 고민 & 해결 온보딩 - 뷰포트 1개, 자석처럼 스냅 */}
        <ConcernSection />
      </div>
    </main>
  )
}

export default LandingPage

