'use client'

import { Bell, BellSlash, ArrowLeft, DotsThreeVertical } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

interface InvestmentViewHeaderProps {
  title: string
  showStickyTitle: boolean
  notificationOn: boolean
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  toggleNotification: () => void
}

export default function InvestmentViewHeader({
  title,
  showStickyTitle,
  notificationOn,
  onBack,
  onEdit,
  onDelete,
  toggleNotification,
}: InvestmentViewHeaderProps) {
  return (
    <header className="h-[52px] flex items-center justify-between px-6 bg-background sticky top-0 z-50 border-b border-border-subtle-lighter">
      <button
        onClick={onBack}
        className="p-2 text-foreground hover:text-foreground transition-colors -ml-1"
        aria-label="뒤로가기"
      >
        <ArrowLeft className="w-6 h-6" weight="regular" />
      </button>
      {showStickyTitle && (
        <h1 className="flex-1 text-center text-base font-semibold tracking-tight text-foreground truncate mx-2">
          {title}
        </h1>
      )}
      {!showStickyTitle && <div className="flex-1" />}

      <div className="flex items-center -mr-1">
        <button
          type="button"
          onClick={toggleNotification}
          className="p-2 text-foreground hover:text-foreground transition-colors"
          aria-label={notificationOn ? '알림 끄기' : '알림 켜기'}
        >
          {notificationOn ? (
            <Bell className="w-6 h-6" weight="regular" />
          ) : (
            <BellSlash className="w-6 h-6 text-muted-foreground" weight="regular" />
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-2 text-foreground hover:text-foreground transition-colors"
              aria-label="메뉴"
            >
              <DotsThreeVertical className="w-6 h-6" weight="regular" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[140px]">
            <DropdownMenuItem onClick={onEdit}>
              수정하기
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              삭제하기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
