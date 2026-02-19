'use client'

import { useState } from 'react'

export function useSettingsPageUI() {
  const [isBrandStoryOpen, setIsBrandStoryOpen] = useState(false)

  const openBrandStory = () => setIsBrandStoryOpen(true)
  const closeBrandStory = () => setIsBrandStoryOpen(false)

  return {
    isBrandStoryOpen,
    openBrandStory,
    closeBrandStory,
  }
}
