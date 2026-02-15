'use client'

import { createContext, useContext, ReactNode } from 'react'
import { Investment } from '@/app/types/investment'
import type { RateSuggestion } from '@/app/components/InvestmentEditSections/InvestmentEditSheet'

interface InvestmentDetailContextType {
    item: Investment
    isEditMode: boolean
    investmentData: any
    ui: {
        isDeleting: boolean
        isUpdating: boolean
        showDeleteModal: boolean
        setShowDeleteModal: (show: boolean) => void
        setIsEditMode: (open: boolean) => void
        setIsDaysPickerOpen: (open: boolean) => void
    }
    handlers: {
        onSave: () => Promise<void>
        onCancel: () => void
        onDelete: () => Promise<void>
    }
    config: {
        originalRate: number
        formatRate: (rate: number) => string
        rateSuggestions: RateSuggestion[]
        isCustomRate: boolean
    }
}

const InvestmentDetailContext = createContext<InvestmentDetailContextType | undefined>(undefined)

export function InvestmentDetailProvider({
    children,
    value
}: {
    children: ReactNode
    value: InvestmentDetailContextType
}) {
    return (
        <InvestmentDetailContext.Provider value={value}>
            {children}
        </InvestmentDetailContext.Provider>
    )
}

export function useInvestmentDetailContext() {
    const context = useContext(InvestmentDetailContext)
    if (context === undefined) {
        throw new Error('useInvestmentDetailContext must be used within an InvestmentDetailProvider')
    }
    return context
}
