'use client'

import { useState } from 'react'

export function useInvestmentDetailUI() {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDaysPickerOpen, setIsDaysPickerOpen] = useState(false)

  return {
    showDeleteModal,
    setShowDeleteModal,
    isEditMode,
    setIsEditMode,
    isDaysPickerOpen,
    setIsDaysPickerOpen,
  }
}
