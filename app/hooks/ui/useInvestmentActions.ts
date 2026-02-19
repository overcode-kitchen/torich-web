'use client'

import { useState } from 'react'

interface UpdateData {
  monthly_amount: number
  period_years: number
  annual_rate: number
  investment_days?: number[]
}

interface UseInvestmentActionsProps {
  onUpdate: (data: UpdateData) => Promise<void>
  onDelete: () => Promise<void>
  isDeleting?: boolean
  isUpdating?: boolean
}

interface UseInvestmentActionsReturn {
  isDeleting: boolean
  isUpdating: boolean
  handleUpdate: (data: UpdateData) => Promise<void>
  handleDelete: () => Promise<void>
}

export function useInvestmentActions({
  onUpdate,
  onDelete,
  isDeleting: externalIsDeleting = false,
  isUpdating: externalIsUpdating = false,
}: UseInvestmentActionsProps): UseInvestmentActionsReturn {
  const [isDeleting, setIsDeleting] = useState(externalIsDeleting)
  const [isUpdating, setIsUpdating] = useState(externalIsUpdating)

  const handleUpdate = async (data: UpdateData) => {
    setIsUpdating(true)
    try {
      await onUpdate(data)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    isDeleting: isDeleting || externalIsDeleting,
    isUpdating: isUpdating || externalIsUpdating,
    handleUpdate,
    handleDelete,
  }
}
