'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/hooks/auth/useAuth'
import BottomNavigation from './BottomNavigation'

const HIDE_NAV_PATHS = ['/login', '/add', '/auth', '/design-system']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const hideNav =
    HIDE_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    (pathname === '/' && !user)

  return (
    <>
      <div className={hideNav ? '' : 'pb-20'}>
        {children}
      </div>
      {!hideNav && <BottomNavigation />}
    </>
  )
}
