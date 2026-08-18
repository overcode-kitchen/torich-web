'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'

const COIN_SRC = '/icons/3d/coin-front.png'

interface MaskedAmountProps {
  visible: boolean
  /** 가려졌을 때 자리를 채우는 방식 — hero는 코인, 목록·타일은 점 */
  variant?: 'coins' | 'dots'
  children: ReactNode
}

/**
 * 금액 자리를 가린다.
 *
 * 홈의 '이번 달 투자금액'과 같은 코인 마스크를 쓴다 — 같은 관심사(금액 가리기)가 화면마다 다른
 * 모양이면 같은 기능으로 읽히지 않는다. 다만 목록 행·타일에 코인 4개를 넣으면 행 높이가 흔들려
 * 그 자리는 점으로 대신한다.
 */
export default function MaskedAmount({ visible, variant = 'dots', children }: MaskedAmountProps) {
  if (visible) return <>{children}</>

  if (variant === 'coins') {
    return (
      <span className="flex items-center gap-0.5" role="img" aria-label="금액 가려짐">
        {[0, 1, 2, 3].map((i) => (
          <Image key={i} src={COIN_SRC} alt="" width={28} height={28} className="h-7 w-7" />
        ))}
      </span>
    )
  }

  return (
    <span role="img" aria-label="금액 가려짐" className="tracking-[0.15em] text-foreground-subtle">
      •••
    </span>
  )
}
