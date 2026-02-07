'use client'

interface AccountSectionProps {
  email?: string
  isLoggingOut: boolean
  onLogout: () => void
}

export function AccountSection({ email, isLoggingOut, onLogout }: AccountSectionProps) {
  return (
    <>
      <div className="px-4 py-3 border-t border-border-subtle">
        <p className="text-sm text-muted-foreground">로그인된 이메일</p>
        <p className="text-foreground font-medium mt-0.5">{email || '-'}</p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        disabled={isLoggingOut}
        className="w-full px-4 py-3 text-left text-destructive font-medium hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-colors border-t border-border-subtle"
      >
        {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
      </button>
    </>
  )
}
