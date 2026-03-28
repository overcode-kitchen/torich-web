'use client'

import LegalDocumentView from '@/app/components/LegalDocumentView'
import { PRIVACY_POLICY_SECTIONS } from '@/lib/legal/privacy-policy.ko'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'

export default function PrivacyPolicyPage() {
    const { goBack } = useFlowBack({
        rootPath: '/settings',
        enableHistoryFallback: false,
    })

    return (
        <LegalDocumentView
            title="개인정보처리방침"
            sections={PRIVACY_POLICY_SECTIONS}
            onBack={goBack}
        />
    )
}
