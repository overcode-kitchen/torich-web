'use client'

import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#F2F4F6] flex flex-col">
      {/* 1. 상단 로고 */}
      <div className="text-center pt-8 mb-8">
        <h1 className="text-green-500 font-bold text-2xl">토리치</h1>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex items-center justify-center px-6 pb-8">
        <div className="w-full max-w-sm">
          {/* 2. 설명 카드 (White Card) - 텍스트와 이미지만 포함 */}
          <div className="bg-white w-full rounded-[32px] px-6 py-10 shadow-sm">
            {/* 타이틀 */}
            <h2 className="text-2xl font-bold text-gray-900 leading-tight text-left mb-3 whitespace-pre-line">
              매달 꾸준히 적립하면{'\n'}10년 뒤엔 얼마가 될까요?
            </h2>

            {/* 서브 텍스트 */}
            <p className="text-gray-500 text-sm leading-relaxed text-left mb-8 whitespace-pre-line">
              막연한 부자의 꿈, 숫자로 확인해보세요.{'\n'}복리 계산기가 10초 만에 알려드려요.
            </p>

            {/* 이미지 영역 */}
            <div className="w-48 h-48 mx-auto bg-gray-50 rounded-full flex items-center justify-center">
              <span className="text-4xl">🐿️</span>
            </div>
          </div>

          {/* 3. 메인 버튼 (Green Button) - 카드 밖으로 분리 */}
          <button
            onClick={() => router.push('/add')}
            className="w-full bg-[#00C261] hover:bg-green-600 text-white text-lg font-bold py-4 rounded-2xl shadow-md mt-5 mb-8 transition-colors"
          >
            계산기 두드려보기
          </button>

          {/* 4. 로그인 영역 */}
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-3">이미 람쥐이신가요?</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-[#E5E7EB] text-coolgray-600 px-8 py-3 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
