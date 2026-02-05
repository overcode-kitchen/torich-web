'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconChevronDown } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

function LandingPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gradient-to-b from-coolgray-25 to-white text-coolgray-900">
      {/* 하단 네비게이션에 가려지지 않도록 여유 padding 추가 */}
      <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-24">
        {/* 섹션 1: 히어로 */}
        <section className="flex min-h-dvh flex-col px-4 pt-8">
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
              <p className="text-base text-coolgray-600">
                적립식 투자를 캘린더처럼 관리해주는
                <br />
                작은 투자 동반자, 토리치예요.
              </p>
            </div>

            {/* 토리 그래픽 자리 (사용자 일러스트 삽입 영역) */}
            <div className="rounded-3xl bg-brand-50/60 py-16 text-center text-coolgray-900 shadow-sm">
              <p className="text-base font-semibold">토리 그래픽 영역</p>
              <p className="mt-1 text-xs text-coolgray-500">
                (여기에 메인 일러스트가 들어갑니다)
              </p>
            </div>

            {/* 토리치가 해주는 일 카드 */}
            <div className="mt-4 space-y-4 rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-brand-700">토리치가 해주는 일</p>
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
                  <span className="font-semibold text-coolgray-900">다음 투자일 알려줌!</span>
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
                  <span className="font-semibold text-coolgray-900">납입 완료 체크!</span>
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
                  <span className="font-semibold text-coolgray-900">
                    내 적립식 투자 현황 한눈에!
                  </span>
                </li>
              </ul>
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
              <p className="text-center text-sm text-coolgray-500">
                계정 없이도 언제든지 나중에 다시 돌아올 수 있어요.
              </p>

              <div className="mt-2 flex items-center justify-center">
                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-xs text-coolgray-400"
                  aria-label="아래로 스크롤하기"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const secondSection = document.getElementById('landing-section-2')
                      secondSection?.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  <span>더 알아보기</span>
                  <IconChevronDown className="h-5 w-5 animate-bounce" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 2: 고민 & 해결 온보딩 */}
        <section
          id="landing-section-2"
          className="flex min-h-dvh flex-col bg-gradient-to-b from-[#f3e5d6] via-[#d4b38a] to-[#5D4633] px-4 pb-28 pt-10"
        >
          <div className="flex-1 space-y-8">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">
                이런 고민 있지 않아?
              </h2>
              <p className="text-base text-coolgray-700">
                적립식 투자, 마음은 있는데
                <br />
                막상 매달 챙기는 건 쉽지 않죠.
              </p>
            </div>

            {/* 말풍선 리스트 - 온보딩 시안과 유사한 위치/레이아웃 */}
            <div className="relative mt-4 h-40">
              <div className="absolute left-1 top-0 inline-flex max-w-[260px] -rotate-6 rounded-full border border-coolgray-200 bg-white px-5 py-2.5 text-sm font-medium text-coolgray-900 shadow-sm">
                매달 몇 일에 넣어야 했더라...
              </div>
              <div className="absolute right-0 top-9 inline-flex max-w-[260px] rotate-4 justify-end rounded-full border border-coolgray-200 bg-white px-5 py-2.5 text-sm font-medium text-coolgray-900 shadow-sm text-right">
                이번 달 빠뜨린 거 같은데...
              </div>
              <div className="absolute left-6 bottom-0 inline-flex max-w-[260px] -rotate-2 rounded-full border border-coolgray-200 bg-white px-5 py-2.5 text-sm font-medium text-coolgray-900 shadow-sm">
                내가 총 얼마나 넣었지...?
              </div>
            </div>

            {/* 고민하는 토리 그래픽 자리 */}
            <div className="mt-4 rounded-3xl bg-brand-50/60 py-16 text-center text-coolgray-900 shadow-sm">
              <p className="text-base font-semibold">고민에 빠진 토리 그래픽</p>
              <p className="mt-1 text-xs text-coolgray-600">
                (여기에 두 번째 온보딩 일러스트가 들어갑니다)
              </p>
            </div>
          </div>

          {/* 하단 CTA + 로그인 유도 */}
          <div className="mt-8 space-y-4 border-t border-coolgray-200 pt-6">
            <Button
              size="lg"
              className="w-full py-3.5 text-base font-semibold"
              variant="default"
              onClick={() => router.push('/login')}
            >
              무료로 시작하기
            </Button>

            <p className="text-center text-sm text-coolgray-600">
              이미 계정이 있으신가요?{' '}
              <Link
                href="/login"
                className="font-medium text-brand-700 underline-offset-4 hover:underline"
              >
                로그인
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LandingPage

