'use client'

import Image from 'next/image'

export default function ConcernSection() {
  return (
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
  )
}
