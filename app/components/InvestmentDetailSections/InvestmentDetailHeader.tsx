'use client'

import { ArrowLeft, Bell, BellSlash, DotsThreeVertical } from '@phosphor-icons/react'
import { Investment } from '@/app/types/investment'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface InvestmentDetailHeaderProps {
    item: Investment
    onBack: () => void
    showStickyTitle: boolean
    isEditMode: boolean
    setIsEditMode: (mode: boolean) => void
    setShowDeleteModal: (show: boolean) => void
    notificationOn: boolean
    toggleNotification: () => void
}

export function InvestmentDetailHeader({
    item,
    onBack,
    showStickyTitle,
    isEditMode,
    setIsEditMode,
    setShowDeleteModal,
    notificationOn,
    toggleNotification,
}: InvestmentDetailHeaderProps) {
    return (
        <div className="w-full flex items-center justify-between px-6 bg-background">
            <button
                onClick={onBack}
                className="p-2 text-foreground hover:text-foreground transition-colors -ml-1"
                aria-label="뒤로가기"
            >
                <ArrowLeft className="w-6 h-6" weight="regular" />
            </button>
            {showStickyTitle && (
                <h1 className="flex-1 text-center text-base font-semibold tracking-tight text-foreground truncate mx-2">
                    {item.title}
                </h1>
            )}
            {!showStickyTitle && <div className="flex-1" />}

            {!isEditMode ? (
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
                            <DropdownMenuItem onClick={() => setIsEditMode(true)}>
                                수정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setShowDeleteModal(true)}
                                className="text-red-600 focus:text-red-600"
                            >
                                삭제하기
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ) : (
                <div className="w-10" />
            )}
        </div>
    )
}
