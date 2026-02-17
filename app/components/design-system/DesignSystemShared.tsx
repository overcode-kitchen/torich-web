"use client"

import { useState } from "react"
import { Check, Copy } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch (error) {
            console.error("복사 실패", error)
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center rounded-md p-1.5 text-coolgray-500 transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label={`${value} 복사`}
        >
            {copied ? <Check className="size-3.5 text-brand-600" /> : <Copy className="size-3.5" />}
        </button>
    )
}

export function NameLabel({
    label,
    token,
    usage,
    tokenOnly,
}: {
    label: string
    token: string
    usage?: string
    /** 색상 스와치 등: 라벨은 토큰만 표시 (이름·토큰 중복 방지) */
    tokenOnly?: boolean
}) {
    return (
        <div className="flex items-start justify-between gap-2 text-xs">
            <div>
                {tokenOnly ? (
                    <code className="font-medium text-coolgray-700">{token}</code>
                ) : (
                    <>
                        <span className="font-medium text-coolgray-700">{label}</span>
                        <span className="text-coolgray-500"> · </span>
                        <code className="text-coolgray-600">{token}</code>
                    </>
                )}
                {usage && <p className="mt-0.5 text-coolgray-500">{usage}</p>}
            </div>
            <CopyButton value={token} />
        </div>
    )
}
