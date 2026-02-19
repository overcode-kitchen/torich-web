'use client'

import { cn } from '@/lib/utils'
import { CoreSection } from '@/app/components/design-system/CoreSection'
import { Icons3DSection } from '@/app/components/design-system/Icons3DSection'
import { PatternsSection } from '@/app/components/design-system/PatternsSection'
import { TokensSection } from '@/app/components/design-system/TokensSection'
import type { UseDesignSystemReturn } from '@/app/hooks/ui/useDesignSystem'

interface DesignSystemViewProps {
    activeTab: UseDesignSystemReturn['activeTab']
    setActiveTab: UseDesignSystemReturn['setActiveTab']
    tabs: UseDesignSystemReturn['tabs']
}

export default function DesignSystemView({
    activeTab,
    setActiveTab,
    tabs,
}: DesignSystemViewProps) {
    return (
        <main className="min-h-screen bg-coolgray-25">
            <div className="max-w-[1000px] mx-auto px-4 py-8 space-y-12">
                {/* 페이지 제목 */}
                <header className="border-b border-coolgray-200 pb-6">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight lg:leading-[1.1] text-coolgray-900">
                        디자인 시스템
                    </h1>
                    <p className="text-base text-muted-foreground mt-2">
                        프로젝트에서 사용하는 타이포그래피, 버튼, 카드, 색상 팔레트를 모아둔 참고용 페이지입니다.
                    </p>
                </header>

                {/* 탭 - 스크롤 시 상단 고정 */}
                <div className="sticky top-0 z-10 -mx-4 px-4 py-3 flex flex-wrap gap-2 bg-coolgray-25 border-b border-coolgray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                                activeTab === tab.id
                                    ? "bg-coolgray-900 text-white"
                                    : "bg-white text-coolgray-700 hover:bg-coolgray-100"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "core" && <CoreSection />}
                {activeTab === "patterns" && <PatternsSection />}
                {activeTab === "tokens" && <TokensSection />}
                {activeTab === "icons3d" && <Icons3DSection />}

                {/* Footer */}
                <footer className="pt-4 text-center text-sm text-muted-foreground">
                    /design-system — 내부 참고용
                </footer>
            </div>
        </main>
    )
}
