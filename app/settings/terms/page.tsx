'use client'

import LegalDocumentView from '@/app/components/LegalDocumentView'
import { TERMS_OF_SERVICE_SECTIONS } from '@/lib/legal/terms-of-service.ko'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'

export default function TermsOfServicePage() {
    const { goBack } = useFlowBack({
        rootPath: '/settings',
        enableHistoryFallback: false,
    })

    return (
        <LegalDocumentView
            title="서비스 이용약관"
            sections={TERMS_OF_SERVICE_SECTIONS}
            onBack={goBack}
        />
    )
}
