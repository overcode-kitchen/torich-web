import Image from 'next/image'
import type { ReactNode } from 'react'

interface HeaderProps {
  rightSlot?: ReactNode
}

export default function Header({ rightSlot }: HeaderProps) {
  return (
    <header className="h-[52px] flex items-center justify-between px-4">
      <div className="relative h-8 w-28">
        <Image
          src="/images/torich-logo.png"
          alt="토리치 로고"
          fill
          className="object-contain object-left"
        />
      </div>
      {rightSlot && <div className="flex items-center">{rightSlot}</div>}
    </header>
  )
}
