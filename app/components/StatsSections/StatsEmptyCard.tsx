'use client'

import { Button } from '@/components/ui/button'

interface StatsEmptyCardProps {
  title: string
  description: string
  /** 없으면 안내만 하고 버튼을 숨긴다 */
  actionLabel?: string
  onAction?: () => void
}

/**
 * 통계 탭 공용 빈 상태 카드.
 *
 * 탭 구조에서는 카드가 스스로 null을 렌더해 넘길 수 없다(탭 화면 자체가 빈 채로 남는다).
 * 그래서 탭마다 "무엇이 없고 무엇을 하면 채워지는지"를 이 카드로 말한다.
 */
export default function StatsEmptyCard({
  title,
  description,
  actionLabel,
  onAction,
}: StatsEmptyCardProps) {
  return (
    <section className="bg-card rounded-2xl p-6 mb-4 text-center">
      <h2 className="text-base font-bold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground whitespace-pre-line">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </section>
  )
}
