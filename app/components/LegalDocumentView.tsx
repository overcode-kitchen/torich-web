'use client'

import { ArrowLeft } from '@phosphor-icons/react'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import type { LegalSection } from '@/lib/legal/types'
import { APP_TAB_CONTENT_PADDING_BOTTOM } from '@/app/constants/layout-constants'

export interface LegalDocumentViewProps {
    title: string
    sections: LegalSection[]
    onBack: () => void
}

export default function LegalDocumentView({ title, sections, onBack }: LegalDocumentViewProps) {
    const isNativeApp = useIsNativeApp()
    const headerSafeTop = isNativeApp ? 'max(env(safe-area-inset-top, 0px), 44px)' : '0px'
    const toolbarHeightPx = 52
    const contentPaddingTop = isNativeApp
        ? `calc(max(env(safe-area-inset-top, 0px), 44px) + ${toolbarHeightPx}px + 8px)`
        : `${toolbarHeightPx + 8}px`

    return (
        <main className="min-h-screen bg-surface" style={{ paddingTop: contentPaddingTop }}>
            <header
                className="fixed inset-x-0 top-0 z-30 w-full bg-surface"
                style={{ paddingTop: headerSafeTop }}
            >
                <div className="h-[52px] flex items-center px-2">
                    <button
                        type="button"
                        onClick={onBack}
                        className="p-2 text-foreground-soft hover:text-foreground transition-colors"
                        aria-label="뒤로가기"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <div
                className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-2"
                style={{ paddingBottom: APP_TAB_CONTENT_PADDING_BOTTOM }}
            >
                <h1 className="text-xl font-bold tracking-tight text-foreground mb-6">{title}</h1>

                <article className="space-y-8 text-foreground">
                    {sections.map((section, index) => (
                        <section key={`legal-section-${index}`}>
                            {section.heading && (
                                <h2 className="text-lg font-semibold tracking-tight text-foreground mb-3">
                                    {section.heading}
                                </h2>
                            )}
                            <div className="space-y-4">
                                {section.paragraphs.map((paragraph, pIndex) => (
                                    <p
                                        key={`${index}-${pIndex}`}
                                        className="text-base leading-relaxed text-foreground"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </section>
                    ))}
                </article>
            </div>
        </main>
    )
}
