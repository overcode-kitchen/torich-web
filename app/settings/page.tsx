'use client'

import { useSettingsAuth } from '@/app/hooks/auth/useSettingsAuth'
import { useGlobalNotification } from '@/app/hooks/notification/useGlobalNotification'
import { useSettingsPageUI } from '@/app/hooks/ui/useSettingsPageUI'
import { useTheme } from '@/app/components/ThemeSections/ThemeProvider'
import SettingsView from '@/app/components/SettingsSections/SettingsView'
import { useAccountDeletion } from '@/app/hooks/auth/useAccountDeletion'

export default function SettingsPage() {
  const { user, isLoading, isLoggingOut, handleLogout } = useSettingsAuth()
  const { notificationOn, toggleNotification } = useGlobalNotification()
  const { theme, setTheme } = useTheme()
  const { isBrandStoryOpen, openBrandStory, closeBrandStory } = useSettingsPageUI()
  const { isDeletingAccount, handleDeleteAccount } = useAccountDeletion()

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
      isDeletingAccount={isDeletingAccount}
      handleDeleteAccount={handleDeleteAccount}
      isBrandStoryOpen={isBrandStoryOpen}
      openBrandStory={openBrandStory}
      closeBrandStory={closeBrandStory}
    />
  )
}

