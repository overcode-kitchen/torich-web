'use client'

import { useSettingsAuth } from '@/app/hooks/auth/useSettingsAuth'
import { useGlobalNotification } from '@/app/hooks/notification/useGlobalNotification'
import { useSettingsPageUI } from '@/app/hooks/ui/useSettingsPageUI'
import { useTheme } from '@/app/components/ThemeSections/ThemeProvider'
import SettingsView from '@/app/components/SettingsSections/SettingsView'
import { useAccountDeletion } from '@/app/hooks/auth/useAccountDeletion'
import { useAppStoreOpen } from '@/app/hooks/platform/useAppStoreOpen'
import { useAppUpdateCheck } from '@/app/hooks/platform/useAppUpdateCheck'

export default function SettingsPage() {
  const { user, isLoading, isLoggingOut, handleLogout } = useSettingsAuth()
  // 값을 조작하는 화면이므로 조회 실패를 사용자에게 알린다(상세 화면들은 조용히 읽기만 한다).
  const { notificationOn, toggleNotification, loadFailed, retryLoad } = useGlobalNotification({
    notifyOnLoadFailure: true,
  })
  const { theme, setTheme } = useTheme()
  const { isBrandStoryOpen, openBrandStory, closeBrandStory } = useSettingsPageUI()
  const { isDeletingAccount, handleDeleteAccount } = useAccountDeletion()
  const { openAppStore } = useAppStoreOpen()
  const { hasUpdate, currentVersion } = useAppUpdateCheck()

  return (
    <SettingsView
      user={user}
      isLoading={isLoading}
      isLoggingOut={isLoggingOut}
      handleLogout={handleLogout}
      notificationOn={notificationOn}
      toggleNotification={toggleNotification}
      notificationLoadFailed={loadFailed}
      onRetryNotificationLoad={retryLoad}
      theme={theme}
      setTheme={setTheme}
      isDeletingAccount={isDeletingAccount}
      handleDeleteAccount={handleDeleteAccount}
      isBrandStoryOpen={isBrandStoryOpen}
      openBrandStory={openBrandStory}
      closeBrandStory={closeBrandStory}
      openAppStore={openAppStore}
      hasUpdate={hasUpdate}
      currentVersion={currentVersion}
    />
  )
}

