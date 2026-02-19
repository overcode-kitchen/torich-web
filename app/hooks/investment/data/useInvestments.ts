'use client'

import { useEffect, useState } from 'react'
import type { Investment } from '@/app/types/investment'
import { useInvestmentsFetch } from './useInvestmentsFetch'
import { useInvestmentsUpdate } from './useInvestmentsUpdate'
import { useInvestmentsDelete } from './useInvestmentsDelete'
import type { UseInvestmentsReturn } from '../../types/useInvestments'

export const useInvestments = (userId?: string): UseInvestmentsReturn => {
  const [records, setRecords] = useState<Investment[]>([])

  const fetch = useInvestmentsFetch(userId, setRecords)
  const update = useInvestmentsUpdate(userId, records, setRecords)
  const deleteOp = useInvestmentsDelete(userId, records, setRecords)

  useEffect((): void => {
    void fetch.refetch()
  }, [fetch.refetch])

  return {
    records,
    setRecords,
    isLoading: fetch.isLoading,
    isUpdating: update.isUpdating,
    isDeleting: deleteOp.isDeleting,
    refetch: fetch.refetch,
    updateInvestment: update.updateInvestment,
    deleteInvestment: deleteOp.deleteInvestment,
  }
}
