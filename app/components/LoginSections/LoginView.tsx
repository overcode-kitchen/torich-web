'use client'

import Image from 'next/image'
import { CircleNotch, ArrowLeft, AppleLogo } from '@phosphor-icons/react'
import GoogleLogo from '@/app/components/GoogleLogo'

interface LoginViewProps {
    isLoading: boolean
    onGoogleLogin: () => void
    onAppleLogin: () => void
    onTestLogin: () => void
    onBack: () => void
    showTestLogin: boolean
}

export default function LoginView({
    isLoading,
    onGoogleLogin,
    onAppleLogin,
    onTestLogin,
    onBack,
    showTestLogin,
}: LoginViewProps) {
    return (
        <main className="min-h-screen bg-surface flex items-center justify-center px-4 relative">
            {/* 뒤로가기 버튼 */}
            <button
                onClick={onBack}
                className="absolute top-4 left-4 p-2 text-foreground-soft hover:text-foreground transition-colors"
                aria-label="뒤로가기"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="w-full max-w-xs">
                {/* 타이틀 */}
                <div className="relative h-9 w-32 mx-auto mb-12">
                    <Image
                        src="/images/torich-logo.png"
                        alt="토리치 로고"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                {/* 구글 로그인 버튼 */}
                <button
                    onClick={onGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-card text-foreground-soft font-medium rounded-xl shadow-md py-4 px-6 flex items-center justify-center gap-3 hover:bg-surface-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <CircleNotch className="w-5 h-5 animate-spin" />
                            <span>연결 중...</span>
                        </>
                    ) : (
                        <>
                            <GoogleLogo />
                            <span>Google로 계속하기</span>
                        </>
                    )}
                </button>

                {/* Apple 로그인 버튼 */}
                <button
                    onClick={onAppleLogin}
                    disabled={isLoading}
                    className="w-full bg-foreground text-background font-medium rounded-xl shadow-md py-4 px-6 flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-3"
                >
                    {isLoading ? (
                        <>
                            <CircleNotch className="w-5 h-5 animate-spin" />
                            <span>연결 중...</span>
                        </>
                    ) : (
                        <>
                            <AppleLogo className="w-5 h-5" weight="fill" />
                            <span>Apple로 계속하기</span>
                        </>
                    )}
                </button>

                {/* 테스트 로그인 버튼 (개발 환경에서만 표시) */}
                {showTestLogin && (
                    <button
                        onClick={onTestLogin}
                        disabled={isLoading}
                        className="w-full bg-secondary text-foreground-soft font-medium rounded-xl py-4 px-6 flex items-center justify-center gap-2 hover:bg-surface-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-3"
                    >
                        {isLoading ? (
                            <>
                                <CircleNotch className="w-5 h-5 animate-spin" />
                                <span>로그인 중...</span>
                            </>
                        ) : (
                            <>
                                <span>🐿️</span>
                                <span>테스트 계정으로 입장</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </main>
    )
}
