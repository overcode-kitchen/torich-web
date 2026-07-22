import type { Investment } from '@/app/types/investment'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Dispatch, SetStateAction } from 'react'

export type UseInvestmentsReturn = {
  records: Investment[]
  isLoading: boolean
  isDeleting: boolean
  isUpdating: boolean
  setRecords: Dispatch<SetStateAction<Investment[]>>
  refetch: () => Promise<void>
  addInvestment: (record: Investment) => void
  updateInvestment: (id: string, data: Partial<Investment>) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>
  /** 적립 항목 순서 저장(드래그 정렬). orderedIds 인덱스를 sort_order로 반영. */
  reorderInvestments: (orderedIds: string[]) => Promise<void>
}

export type RecordsSelectResult = {
  data: Investment[] | null
  error: PostgrestError | null
}

export type RecordUpdateResult = {
  data: Investment | null
  error: PostgrestError | null
}

export type RecordDeleteResult = {
  error: PostgrestError | null
}
