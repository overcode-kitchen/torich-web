"use client"

import { cn } from "@/lib/utils"

import { NameLabel } from "./DesignSystemShared"

export function TokensSection() {
    return (
        <>
            {/* 간격 · 레이아웃 토큰 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    간격 · 레이아웃 토큰
                </h2>
                <div className="rounded-xl border border-coolgray-200 bg-white p-6 space-y-6">
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-coolgray-700">Gap 예시</p>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { gap: "gap-4", label: "gap-4 (16px)", token: "space-4" },
                                { gap: "gap-6", label: "gap-6 (24px)", token: "space-6" },
                                { gap: "gap-8", label: "gap-8 (32px)", token: "space-8" },
                            ].map(({ gap, label, token }) => (
                                <div key={gap} className="space-y-2">
                                    <NameLabel label={label} token={token} />
                                    <div className="rounded-lg border border-border p-4">
                                        <div className={cn("flex", gap)}>
                                            {[1, 2, 3].map((num) => (
                                                <div
                                                    key={num}
                                                    className="flex h-10 w-10 items-center justify-center rounded-md bg-coolgray-100 text-xs font-semibold text-coolgray-700"
                                                >
                                                    {num}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-coolgray-700">컨테이너 폭 가이드</p>
                        <div className="space-y-4">
                            {[
                                { className: "max-w-md", label: "max-w-md (모바일 기본 카드 폭)", token: "container-md" },
                                { className: "max-w-lg", label: "max-w-lg (폼 · 다이얼로그)", token: "container-lg" },
                                { className: "max-w-2xl", label: "max-w-2xl (콘텐츠 상세 / 이 페이지)", token: "container-2xl" },
                            ].map(({ className, label, token }) => (
                                <div key={label} className="space-y-2">
                                    <NameLabel label={label} token={token} />
                                    <div className="w-full rounded-lg border border-dashed border-border bg-muted/40 p-4">
                                        <div className={cn("h-12 rounded-md bg-white shadow-xs", className)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 경계 · 쉐도우 가이드 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    경계 · 쉐도우 가이드
                </h2>
                <div className="grid gap-6 sm:grid-cols-2">
                    {[
                        {
                            title: "rounded-md + border",
                            description: "작은 배지나 입력 필드에 사용합니다.",
                            token: "surface-border-sm",
                            classes: "rounded-md border border-border bg-white p-4 text-sm text-muted-foreground",
                        },
                        {
                            title: "rounded-xl + shadow-sm",
                            description: "대부분의 카드 기본 스타일입니다.",
                            token: "surface-shadow-sm",
                            classes: "rounded-xl bg-white p-4 text-sm text-muted-foreground shadow-sm",
                        },
                        {
                            title: "rounded-2xl + shadow-md",
                            description: "강조 카드나 모달 상단에 사용합니다.",
                            token: "surface-shadow-md",
                            classes: "rounded-2xl bg-white p-6 text-sm text-muted-foreground shadow-md",
                        },
                        {
                            title: "border-dashed",
                            description: "빈 상태나 추가 CTA에 적합합니다.",
                            token: "surface-dashed",
                            classes: "rounded-xl border-2 border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground",
                        },
                    ].map(({ title, description, classes, token }) => (
                        <div key={title} className="space-y-2">
                            <NameLabel label={title} token={token} />
                            <div className={classes}>
                                <p className="font-semibold text-coolgray-900">{title}</p>
                                <p className="mt-1 text-muted-foreground">{description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    )
}
