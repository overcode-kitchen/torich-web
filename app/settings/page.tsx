'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [notificationOn, setNotificationOn] = useState(true)
  const [isBrandStoryOpen, setIsBrandStoryOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser()
      setUser(u)
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('torich_notification_global')
        setNotificationOn(stored === null ? true : stored === '1')
      }
      setIsLoading(false)
    }
    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      router.replace('/login')
      window.location.href = '/login'
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const toggleNotification = () => {
    const next = !notificationOn
    setNotificationOn(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('torich_notification_global', next ? '1' : '0')
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-coolgray-25 flex items-center justify-center">
        <IconLoader2 className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  if (!user) {
    router.replace('/login')
    return null
  }

  return (
    <main className="min-h-screen bg-coolgray-25">
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <h1 className="text-xl font-bold text-coolgray-900 mb-6">설정</h1>

        {/* 알림 설정 */}
        <section className="bg-white rounded-2xl overflow-hidden mb-4">
          <h2 className="text-sm font-semibold text-coolgray-600 px-4 pt-4 pb-2">알림</h2>
          <div className="flex items-center justify-between px-4 py-3 border-t border-coolgray-100">
            <span className="text-coolgray-900 font-medium">전체 알림</span>
            <button
              type="button"
              role="switch"
              aria-checked={notificationOn}
              onClick={toggleNotification}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                notificationOn ? 'bg-brand-500' : 'bg-coolgray-200'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  notificationOn ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-coolgray-500 px-4 pb-4">(추후) 알림 시간대, 메시지 톤 설정</p>
        </section>

        {/* 계정 */}
        <section className="bg-white rounded-2xl overflow-hidden mb-4">
          <h2 className="text-sm font-semibold text-coolgray-600 px-4 pt-4 pb-2">계정</h2>
          <div className="px-4 py-3 border-t border-coolgray-100">
            <p className="text-sm text-coolgray-500">로그인된 이메일</p>
            <p className="text-coolgray-900 font-medium mt-0.5">{user.email || '-'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full px-4 py-3 text-left text-red-600 font-medium hover:bg-red-50 transition-colors border-t border-coolgray-100"
          >
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>
        </section>

        {/* 브랜드 스토리 */}
        <section className="bg-white rounded-2xl overflow-hidden mb-4">
          <h2 className="text-sm font-semibold text-coolgray-600 px-4 pt-4 pb-2">브랜드 스토리</h2>
          <button
            type="button"
            onClick={() => setIsBrandStoryOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 border-t border-coolgray-100 hover:bg-coolgray-50 transition-colors"
            aria-haspopup="dialog"
            aria-expanded={isBrandStoryOpen}
          >
            <div className="flex flex-col items-start">
              <span className="text-coolgray-900 font-medium">토리치가 궁금하다면</span>
              <span className="text-sm text-coolgray-500 mt-0.5">
                이름에 담긴 의미와 우리가 추구하는 방향을 소개해요.
              </span>
            </div>
            <span className="ml-3 text-coolgray-400 text-lg" aria-hidden="true">
              ›
            </span>
          </button>
        </section>

        {/* 브랜드 스토리 바텀시트 */}
        {isBrandStoryOpen && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="토리치 브랜드 스토리"
            onClick={() => setIsBrandStoryOpen(false)}
          >
            <div
              className="bg-white rounded-t-3xl max-h-[80vh] max-w-md mx-auto w-full shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mt-3 mb-3 h-1 w-10 rounded-full bg-coolgray-200 shrink-0" />
              <div className="flex-1 overflow-y-auto scrollbar-thin px-6 pb-4 pt-1 min-h-0">
                <div className="mb-4">
                  <div className="relative w-full">
                    <Image
                      src="/torich-squirrel.png"
                      alt="도토리를 모으는 토리치 람쥐 일러스트"
                      width={368}
                      height={460}
                      className="w-full h-auto rounded-xl"
                      priority
                    />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-coolgray-900 mb-3">
                  토리치(Torich)는 &quot;(도)토리 + 리치&quot;의 합성어예요.
                </h2>
                <div className="space-y-3 text-sm leading-relaxed text-coolgray-700">
                  <p>
                    도토리를 조금씩 모으듯, 작은 투자와 저축이 쌓여 언젠가 &quot;리치&quot;한 삶으로 이어진다는 믿음에서
                    시작된 이름이에요. 한 번에 큰 결심을 요구하기보다는, 오늘 할 수 있는 가장 작고 부드러운 한 걸음을
                    도와주는 투자 동반자를 지향합니다.
                  </p>
                  <p>
                    토리치는 어려운 전문 용어보다 &quot;적립식 투자&quot;를 쉽게 시작하고, 꾸준히 이어갈 수 있게 도와주는
                    서비스예요. 캘린더와 그래프, 목표 금액과 투자 기록을 통해 &quot;나는 얼마나 잘 쌓아가고 있는가&quot;를
                    한눈에 확인할 수 있도록 설계했어요.
                  </p>
                  <div className="pt-1">
                    <p className="text-coolgray-900 font-medium mb-1">우리가 사용자에게 바라는 것</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>단기 수익보다, 내가 원하는 삶의 속도와 방향을 먼저 떠올리기</li>
                      <li>완벽한 투자자가 되기보다, 꾸준한 투자자가 되기</li>
                      <li>숫자에 쫓기지 않고, 숫자를 통해 마음이 편안해지는 경험을 쌓기</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="shrink-0 px-6 pb-6 pt-4 bg-white rounded-b-3xl">
                <Button
                  type="button"
                  onClick={() => setIsBrandStoryOpen(false)}
                  size="lg"
                  className="w-full"
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 앱 정보 */}
        <section className="bg-white rounded-2xl overflow-hidden">
          <h2 className="text-sm font-semibold text-coolgray-600 px-4 pt-4 pb-2">앱 정보</h2>
          <div className="px-4 py-3 border-t border-coolgray-100 flex justify-between items-center">
            <span className="text-coolgray-900">버전</span>
            <span className="text-coolgray-500 text-sm">1.0.0</span>
          </div>
          <a
            href="mailto:support@torich.app"
            className="block px-4 py-3 text-coolgray-900 font-medium hover:bg-coolgray-50 border-t border-coolgray-100"
          >
            문의하기
          </a>
          <a
            href="#"
            className="block px-4 py-3 text-coolgray-600 text-sm hover:bg-coolgray-50 border-t border-coolgray-100"
          >
            이용약관
          </a>
          <a
            href="#"
            className="block px-4 py-3 text-coolgray-600 text-sm hover:bg-coolgray-50 border-t border-coolgray-100"
          >
            개인정보처리방침
          </a>
        </section>
      </div>
    </main>
  )
}

