'use client'

import { usePathname } from 'next/navigation'
import BottomNavigation from './BottomNavigation'

const HIDE_NAV_PATHS = ['/login', '/add', '/auth', '/design-system']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNav = HIDE_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))

  return (
    <>
      <div className={hideNav ? '' : 'pb-20'}>
        {children}
      </div>
      {!hideNav && <BottomNavigation />}
    </>
  )
}
