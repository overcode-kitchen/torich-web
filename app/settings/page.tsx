'use client'

import { useSettingsAuth } from '@/app/hooks/useSettingsAuth'
import { useGlobalNotification } from '@/app/hooks/useGlobalNotification'
import { useSettingsPageUI } from '@/app/hooks/useSettingsPageUI'
import { useTheme } from '@/app/components/ThemeSections/ThemeProvider'
import SettingsView from '@/app/components/SettingsSections/SettingsView'

export default function SettingsPage() {
  const { user, isLoading, isLoggingOut, handleLogout } = useSettingsAuth()
  const { notificationOn, toggleNotification } = useGlobalNotification()
  const { theme, setTheme } = useTheme()
  const { isBrandStoryOpen, openBrandStory, closeBrandStory } = useSettingsPageUI()

  return (
    <SettingsView
      user={user}
      isLoading={isLoading}
      isLoggingOut={isLoggingOut}
      handleLogout={handleLogout}
      notificationOn={notificationOn}
      toggleNotification={toggleNotification}
      theme={theme}
      setTheme={setTheme}
      isBrandStoryOpen={isBrandStoryOpen}
      openBrandStory={openBrandStory}
      closeBrandStory={closeBrandStory}
    />
  )
}

