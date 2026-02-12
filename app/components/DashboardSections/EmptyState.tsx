'use client'

import { useRouter } from 'next/navigation'
import { Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export interface EmptyStateProps {
  onAddClick: () => void
}

export default function EmptyState({ onAddClick }: EmptyStateProps) {
  const router = useRouter()

  return (
    <div className="bg-card rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6">
      <p className="text-muted-foreground text-lg">아직 등록된 투자가 없어요</p>
      <Button
        size="lg"
        className="rounded-2xl shadow-lg"
        onClick={onAddClick}
      >
        <Plus className="w-5 h-5" />
        투자 목록 추가하기
      </Button>
    </div>
  )
}
