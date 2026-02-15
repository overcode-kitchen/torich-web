'use client'

import Image from 'next/image'

export default function ConcernSection() {
  return (
    <section
      id="landing-section-2"
      className="flex h-dvh shrink-0 snap-start snap-always flex-col overflow-y-auto overflow-x-hidden px-4 pt-10"
      style={{
        background: '#292A2E',
      }}
      aria-label="고민 공감"
    >
      {/* 상단 텍스트 영역 - mb-8으로 말풍선과 최소 간격 확보, 겹침 방지 */}
      <div className="mb-8 shrink-0 space-y-3 pl-4 pr-4">
        <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground">
          이런 고민 있지 않아?
        </h2>
        <p className="text-base text-primary-foreground/85">
          적립식 투자, 마음은 있는데
          <br />
          막상 매달 챙기는 건 쉽지 않죠.
        </p>
      </div>

      {/* 가변 공간: min-h-[min-content]로 내용 높이만큼 유지 → 텍스트와 말풍선 겹침 방지, 부족하면 섹션 스크롤 */}
      <div className="flex min-h-[min-content] flex-1 flex-col justify-end">
        {/* 말풍선 + 그래픽 한 덩어리 - 항상 붙어 있음 */}
        <div className="relative z-10 flex flex-col">
          {/* 말풍선 리스트 - overflow-visible로 버블버블이 아래로 나가도 잘리지 않게 */}
          <div className="relative mt-4 h-48 overflow-visible">
            <div className="absolute left-1 top-0 inline-flex max-w-[260px] -rotate-6 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm">
            매달 몇 일에 넣어야 했더라...
            </div>
            <div className="absolute right-0 top-14 inline-flex max-w-[260px] rotate-4 justify-end rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm text-right">
            이번 달 빠뜨린 거 같은데...
            </div>
            <div className="absolute left-6 bottom-10 inline-flex max-w-[260px] -rotate-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm">
            내가 총 얼마나 넣었지...?
            </div>
            {/* bubblebubble.svg - z-20으로 그래픽 래퍼와 겹쳐도 위에 보이게 */}
            <div className="absolute -bottom-7 left-1/2 z-20 -translate-x-1/2">
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

          {/* 고민하는 토리 그래픽 - 말풍선 바로 아래에 붙음, 자연 크기 */}
          <div className="relative z-0 -mx-4 mt-2 w-[calc(100%+2rem)] overflow-hidden">
            <div className="relative w-full aspect-square shrink-0">
              <Image
                src="/images/torich_graphic(thinking).png"
                alt="고민에 빠진 토리 - 적립식 투자를 고민하는 다람쥐 캐릭터"
                fill
                sizes="(max-width: 448px) 100vw, 448px"
                className="object-contain object-bottom"
                priority
              />
              {/* 그라데이션 오버레이 - 이미지 박스 최상단에 붙어 배경과 자연스럽게 이어지게 */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 bottom-0 z-10"
                style={{
                  background:
                    'linear-gradient(to bottom, #292A2E 0%, #292A2E 18%, rgba(41,42,46,0.92) 38%, rgba(41,42,46,0.5) 60%, transparent 100%)',
                }}
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
