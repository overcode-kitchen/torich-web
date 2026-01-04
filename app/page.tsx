'use client'

export default function Home() {
  const mockItems = [
    { id: 1, title: 'S&P500', amount: '10만', period: '3년', expected: '5천' },
    { id: 2, title: '테슬라', amount: '20만', period: '5년', expected: '1.5억' },
    { id: 3, title: '비트코인', amount: '15만', period: '2년', expected: '8천' },
  ]

  return (
    <main className="min-h-screen bg-coolgray-25">
      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        {/* 상단 요약 카드 */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="space-y-4">
            <p className="text-coolgray-900 text-lg leading-relaxed">
              사장님, 모든 계획이 성공하면 5년 뒤{' '}
              <span className="text-brand-600 text-4xl font-bold">3.2억</span>이 생겨요!
            </p>
            <p className="text-coolgray-500 text-sm">
              현재 월 투자금 합계: 45만 원
            </p>
          </div>
        </div>

        {/* 하단 리스트 */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-coolgray-900 px-2">
            투자할 목록 추가하기
          </h2>
          
          <div className="space-y-1">
            {mockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-4 px-2 border-b border-coolgray-100 last:border-b-0"
              >
                <div className="flex-1">
                  <div className="font-semibold text-coolgray-900 mb-1">
                    {item.title}
                  </div>
                  <div className="text-xs text-coolgray-400">
                    월 {item.amount} / {item.period}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-coolgray-900">
                    총 {item.expected}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
