'use client'

import { createContext, useContext, ReactNode } from 'react'
import { Investment } from '@/app/types/investment'
import type { UseInvestmentDataReturn } from '@/app/hooks/types/useInvestmentData'

interface InvestmentDetailContextType {
    item: Investment
    investmentData: UseInvestmentDataReturn
    ui: {
        isDeleting: boolean
        showDeleteModal: boolean
        setShowDeleteModal: (show: boolean) => void
    }
    handlers: {
        onDelete: () => Promise<void>
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
