'use client'

import type { LegalSection } from '@/lib/legal/types'
import SubPageScaffold from '@/app/components/SubPageScaffold'

export interface LegalDocumentViewProps {
    title: string
    sections: LegalSection[]
    onBack: () => void
}

export default function LegalDocumentView({ title, sections, onBack }: LegalDocumentViewProps) {
    return (
        <SubPageScaffold onBack={onBack} contentClassName="py-2">
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
        </SubPageScaffold>
    )
}
