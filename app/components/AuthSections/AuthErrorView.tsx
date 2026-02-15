import Image from 'next/image'
import { ArrowLeft } from '@phosphor-icons/react'

interface AuthErrorViewProps {
    onGoBack: () => void
    onGoToLogin: () => void
}

export default function AuthErrorView({ onGoBack, onGoToLogin }: AuthErrorViewProps) {
    return (
        <main className="min-h-screen bg-surface flex items-center justify-center px-4 relative">
            {/* 뒤로가기 버튼 */}
            <button
                onClick={onGoBack}
                className="absolute top-4 left-4 p-2 text-foreground-soft hover:text-foreground transition-colors"
                aria-label="뒤로가기"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="w-full max-w-xs">
                {/* 타이틀 */}
                <div className="relative h-10 w-36 mx-auto mb-4">
                    <Image
                        src="/images/torich-logo.png"
                        alt="토리치 로고"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                {/* 에러 메시지 카드 */}
                <div className="bg-card rounded-3xl shadow-md p-8 text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-foreground text-lg font-semibold">
                            로그인 중 오류가 발생했습니다
                        </p>
                        <p className="text-muted-foreground text-sm">
                            다시 시도해주세요
                        </p>
                    </div>

                    {/* 로그인 화면으로 돌아가기 버튼 */}
                    <button
                        onClick={onGoToLogin}
                        className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-4 px-6 hover:bg-primary/90 transition-colors"
                    >
                        로그인 화면으로 돌아가기
                    </button>
                </div>
            </div>
        </main>
    )
}
