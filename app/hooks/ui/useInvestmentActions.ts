'use client'

import { useState } from 'react'
import { track } from '@/app/lib/analytics'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'

interface UseInvestmentActionsProps {
  onDelete: () => Promise<void>
  isDeleting?: boolean
}

interface UseInvestmentActionsReturn {
  isDeleting: boolean
  handleDelete: () => Promise<void>
}

export function useInvestmentActions({
  onDelete,
  isDeleting: externalIsDeleting = false,
}: UseInvestmentActionsProps): UseInvestmentActionsReturn {
  const [isDeleting, setIsDeleting] = useState(externalIsDeleting)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      track('investment_delete')
      await onDelete()
    } catch {
      toastError(TOAST_MESSAGES.deleteFailed)
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    isDeleting: isDeleting || externalIsDeleting,
    handleDelete,
  }
}
