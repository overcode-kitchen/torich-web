'use client'

import { useState } from 'react'

export function useInvestmentDetailUI() {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  return {
    showDeleteModal,
    setShowDeleteModal,
  }
}
