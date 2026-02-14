"use client"

import { Button } from "@/components/ui/button"
import {
    Plus,
    CircleNotch,
    CaretDown,
    X,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

import { CopyButton, NameLabel } from "./DesignSystemShared"

export function CoreSection() {
    return (
        <>
            {/* 1. 타이포그래피 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    타이포그래피
                </h2>
                <div className="space-y-6 rounded-xl border border-coolgray-200 bg-white p-6">
                    <div>
                        <NameLabel label="H1" token="type-h1" />
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight lg:leading-[1.1]">
                            대제목입니다.
                        </h1>
                        <code className="text-xs text-muted-foreground mt-1 block">
                            text-4xl md:text-5xl font-bold tracking-tight lg:leading-[1.1]
                        </code>
                    </div>
                    <div>
                        <NameLabel label="H2" token="type-h2" />
                        <h2 className="text-3xl font-semibold tracking-tight">
                            중간 제목입니다.
                        </h2>
                        <code className="text-xs text-muted-foreground mt-1 block">
                            text-3xl font-semibold tracking-tight
                        </code>
                    </div>
                    <div>
                        <NameLabel label="H3" token="type-h3" />
                        <h3 className="text-2xl font-semibold tracking-tight">
                            소제목입니다.
                        </h3>
                        <code className="text-xs text-muted-foreground mt-1 block">
                            text-2xl font-semibold tracking-tight
                        </code>
                    </div>
                    <div>
                        <NameLabel label="H4" token="type-h4" />
                        <h4 className="text-xl font-semibold tracking-tight">
                            캡션 제목입니다.
                        </h4>
                        <code className="text-xs text-muted-foreground mt-1 block">
                            text-xl font-semibold tracking-tight
                        </code>
                    </div>
                    <div>
                        <NameLabel label="Body" token="type-body" />
                        <p className="text-base leading-relaxed">
                            본문 텍스트입니다. 두 줄 예시를 위해 이어지는 문장을 간단하게 적어봅니다.
                        </p>
                        <code className="text-xs text-muted-foreground mt-1 block">
                            text-base leading-relaxed
                        </code>
                    </div>
                </div>
            </section>

            {/* 2. 버튼 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    버튼
                </h2>
                <div className="space-y-8 rounded-xl border border-coolgray-200 bg-white p-6">
                    <div>
                        <p className="text-sm font-medium text-coolgray-700 mb-3">Variant</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                { label: "Primary", variant: "default" as const, token: "btn-primary", usage: "메인 액션 (저장, 확인, 시작)" },
                                { label: "Secondary", variant: "secondary" as const, token: "btn-secondary", usage: "보조 액션 (취소, 이전)" },
                                { label: "Outline", variant: "outline" as const, token: "btn-outline", usage: "테두리 강조 (선택·필터 등)" },
                                { label: "Ghost", variant: "ghost" as const, token: "btn-ghost", usage: "최소 강조 (토글, 보조 클릭)" },
                                { label: "Link", variant: "link" as const, token: "btn-link", usage: "텍스트 링크 (더보기, 상세)" },
                                { label: "Destructive", variant: "destructive" as const, token: "btn-destructive", usage: "위험 액션 (삭제, 취소 등)" },
                            ].map(({ label, variant, token, usage }) => (
                                <div key={token} className="space-y-2 rounded-lg border border-border p-3">
                                    <NameLabel label={label} token={token} usage={usage} />
                                    <Button variant={variant}>{label}</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-coolgray-700 mb-3">Size</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                { label: "XS", size: "xs" as const, token: "btn-size-xs", text: "XS", usage: "칩·태그 내부 액션" },
                                { label: "Small", size: "sm" as const, token: "btn-size-sm", text: "Small", usage: "테이블·리스트 보조" },
                                { label: "Default", size: "default" as const, token: "btn-size-md", text: "Default", usage: "일반 폼·카드" },
                                { label: "Large", size: "lg" as const, token: "btn-size-lg", text: "Large", usage: "메인 CTA, 모달 확인" },
                            ].map(({ label, size, token, text, usage }) => (
                                <div key={token} className="space-y-2 rounded-lg border border-border p-3">
                                    <NameLabel label={label} token={token} usage={usage} />
                                    <Button size={size}>{text}</Button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                            <div className="grid grid-cols-4 gap-2 text-center font-medium text-coolgray-900">
                                <span>XS</span>
                                <span>SM</span>
                                <span>MD</span>
                                <span>LG</span>
                            </div>
                            <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                                <span>24px (h-6)</span>
                                <span>32px (h-8)</span>
                                <span>36px (h-9)</span>
                                <span>40px (h-10)</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-coolgray-700 mb-3">Icon 버튼</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                { label: "Icon XS", size: "icon-xs" as const, token: "btn-icon-xs", usage: "테이블·인라인 토글" },
                                { label: "Icon SM", size: "icon-sm" as const, token: "btn-icon-sm", usage: "리스트·카드 보조" },
                                { label: "Icon MD", size: "icon" as const, token: "btn-icon-md", usage: "헤더·툴바 액션" },
                                { label: "Icon LG", size: "icon-lg" as const, token: "btn-icon-lg", usage: "강조 아이콘만" },
                            ].map(({ label, size, token, usage }) => (
                                <div key={token} className="space-y-2 rounded-lg border border-border p-3 text-center">
                                    <NameLabel label={label} token={token} usage={usage} />
                                    <Button size={size} variant="outline" aria-label={label}>
                                        <Plus />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-coolgray-700 mb-3">
                            Primary + Icon (메인 액션)
                        </p>
                        <div className="space-y-2 rounded-lg border border-border p-3">
                            <NameLabel label="CTA Button" token="btn-primary-cta" usage="투자 추가, 저장, 시작 등 핵심 CTA" />
                            <Button size="lg" className="w-full sm:w-auto">
                                <Plus className="size-5" />
                                메인 액션 버튼
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. 카드 스타일 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    카드 스타일
                </h2>
                <div className="space-y-8">
                    {/* 카드 1: 기본 흰색 카드 */}
                    <div className="space-y-2">
                        <NameLabel
                            label="카드 · 컨텐츠"
                            token="card-content"
                            usage="홈 내 투자 목록, UpcomingInvestments, 빈 상태, auth-code-error"
                        />
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <h3 className="text-2xl font-semibold tracking-tight mb-2">카드 제목입니다.</h3>
                            <p className="text-base text-muted-foreground">
                                카드 본문 텍스트입니다. 간단한 설명 문장을 두 줄 정도 넣어둡니다.
                            </p>
                        </div>
                    </div>

                    {/* 카드 2: 테두리 카드 */}
                    <div className="space-y-2">
                        <NameLabel
                            label="카드 · 정보 라인"
                            token="card-outline"
                            usage="홈 이번 달 투자금액 영역 (라벨 + 값 좌우 배치)"
                        />
                        <div className="rounded-2xl border border-coolgray-100 bg-white px-4 py-3">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-coolgray-900">카드 라벨</span>
                                <span className="text-base font-semibold text-coolgray-900">값입니다</span>
                            </div>
                        </div>
                    </div>

                    {/* 카드 3: 브랜드 CTA 카드 */}
                    <div className="space-y-2">
                        <NameLabel
                            label="카드 · CTA"
                            token="card-cta"
                            usage="홈 투자 목록 추가 버튼, add 페이지, InvestmentDetailView, InvestmentDaysPickerSheet"
                        />
                        <div className="rounded-2xl bg-primary px-4 py-4 text-primary-foreground">
                            <p className="font-semibold">콜투액션 제목입니다</p>
                            <p className="text-sm text-white/90 mt-0.5">간단한 설명 또는 한 줄 안내 문장입니다.</p>
                        </div>
                    </div>

                    {/* 카드 4: Muted 카드 */}
                    <div className="space-y-2">
                        <NameLabel
                            label="카드 · 보조"
                            token="card-muted"
                            usage="테이블 헤더, 폼 보조 영역 등"
                        />
                        <div className="rounded-xl border border-border bg-muted/50 p-4">
                            <p className="text-base text-foreground">
                                배경이 부드러운 보조 카드 스타일 예시 텍스트입니다.
                            </p>
                        </div>
                    </div>

                    {/* 카드 5: 필터 칩 */}
                    <div className="space-y-4">
                        <p className="text-sm font-medium text-coolgray-700">홈 투자 목록 필터 (전체/진행 중/종료)</p>
                        <div className="flex gap-4 flex-wrap">
                            <div className="space-y-2">
                                <NameLabel label="칩 · 선택됨" token="chip-active" />
                                <span className="rounded-lg px-3 py-1 text-xs font-medium bg-coolgray-900 text-white">
                                    선택됨
                                </span>
                            </div>
                            <div className="space-y-2">
                                <NameLabel label="칩 · 기본" token="chip-neutral" />
                                <span className="rounded-lg px-3 py-1 text-xs font-normal bg-coolgray-25 text-coolgray-600">
                                    전체
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. 색상 팔레트 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    색상 팔레트
                </h2>
                <div className="space-y-6 rounded-xl border border-coolgray-200 bg-white p-6">
                    <div>
                        <p className="text-sm font-medium text-coolgray-700 mb-3">Semantic (시맨틱)</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[
                                { name: "primary", token: "color-primary", bg: "bg-primary", text: "text-primary-foreground" },
                                { name: "secondary", token: "color-secondary", bg: "bg-secondary", text: "text-secondary-foreground" },
                                { name: "muted", token: "color-muted", bg: "bg-muted", text: "text-muted-foreground" },
                                { name: "muted-darker", token: "color-muted-darker", bg: "bg-muted-darker", text: "text-foreground-soft" },
                                { name: "accent", token: "color-accent", bg: "bg-accent", text: "text-accent-foreground" },
                                { name: "destructive", token: "color-destructive", bg: "bg-destructive", text: "text-white" },
                                { name: "background", token: "color-background", bg: "bg-background", text: "text-foreground", border: true },
                            ].map((c) => (
                                <div key={c.name} className="space-y-2">
                                    <NameLabel label={c.name} token={c.token} />
                                    <div
                                        className={cn(
                                            "rounded-lg p-3 text-sm font-medium",
                                            c.bg,
                                            c.text,
                                            c.border && "border border-border"
                                        )}
                                    >
                                        {c.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-coolgray-700 mb-3">Brand</p>
                        <div className="grid grid-cols-5 gap-3">
                            {[
                                { n: 50, light: true },
                                { n: 100, light: true },
                                { n: 200, light: true },
                                { n: 300, light: true },
                                { n: 400, light: true },
                                { n: 500, light: false },
                                { n: 600, light: false },
                                { n: 700, light: false },
                                { n: 800, light: false },
                                { n: 900, light: false },
                            ].map(({ n, light }) => (
                                <div key={n} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-coolgray-600">brand-{n}</span>
                                        <CopyButton value={`color-brand-${n}`} />
                                    </div>
                                    <div
                                        className={cn(
                                            "rounded-lg h-12 flex items-center justify-center text-xs font-medium",
                                            light ? "text-coolgray-800" : "text-white",
                                            n === 50 && "bg-brand-50",
                                            n === 100 && "bg-brand-100",
                                            n === 200 && "bg-brand-200",
                                            n === 300 && "bg-brand-300",
                                            n === 400 && "bg-brand-400",
                                            n === 500 && "bg-brand-500",
                                            n === 600 && "bg-brand-600",
                                            n === 700 && "bg-brand-700",
                                            n === 800 && "bg-brand-800",
                                            n === 900 && "bg-brand-900"
                                        )}
                                    >
                                        {n}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            brand-500: 기본 강조 컬러, brand-600: 주요 CTA에 사용
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-coolgray-700 mb-3">Cool Gray</p>
                        <div className="grid grid-cols-6 gap-3">
                            {[
                                { n: 25, light: true },
                                { n: 50, light: true },
                                { n: 75, light: true },
                                { n: 100, light: true },
                                { n: 200, light: true },
                                { n: 300, light: true },
                                { n: 400, light: true },
                                { n: 500, light: true },
                                { n: 600, light: false },
                                { n: 700, light: false },
                                { n: 800, light: false },
                                { n: 850, light: false },
                                { n: 900, light: false },
                                { n: 950, light: false },
                                { n: 1000, light: false },
                            ].map(({ n, light }) => (
                                <div key={n} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-coolgray-600">coolgray-{n}</span>
                                        <CopyButton value={`color-coolgray-${n}`} />
                                    </div>
                                    <div
                                        className={cn(
                                            "rounded-lg h-10 flex items-center justify-center text-xs font-medium",
                                            light ? "text-coolgray-800" : "text-white",
                                            n === 25 && "bg-coolgray-25",
                                            n === 50 && "bg-coolgray-50",
                                            n === 75 && "bg-coolgray-75",
                                            n === 100 && "bg-coolgray-100",
                                            n === 200 && "bg-coolgray-200",
                                            n === 300 && "bg-coolgray-300",
                                            n === 400 && "bg-coolgray-400",
                                            n === 500 && "bg-coolgray-500",
                                            n === 600 && "bg-coolgray-600",
                                            n === 700 && "bg-coolgray-700",
                                            n === 800 && "bg-coolgray-800",
                                            n === 850 && "bg-coolgray-850",
                                            n === 900 && "bg-coolgray-900",
                                            n === 950 && "bg-coolgray-950",
                                            n === 1000 && "bg-coolgray-1000"
                                        )}
                                    >
                                        {n}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. 아이콘 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    사용하는 아이콘
                </h2>
                <div className="rounded-xl border border-coolgray-200 bg-white p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        {[
                            { icon: <Plus className="size-8" />, label: "Plus", usage: "추가 / 생성", token: "icon-plus" },
                            { icon: <CircleNotch className="size-8 animate-spin text-muted-foreground" />, label: "CircleNotch", usage: "로딩 상태", token: "icon-loader" },
                            { icon: <CaretDown className="size-8" />, label: "CaretDown", usage: "드롭다운", token: "icon-chevron-down" },
                            { icon: <X className="size-8" />, label: "X", usage: "닫기 / 해제", token: "icon-close" },
                        ].map(({ icon, label, usage, token }) => (
                            <div key={label} className="space-y-2">
                                <NameLabel label={label} token={token} />
                                <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-coolgray-25 p-4 text-center">
                                    <span className="text-coolgray-900">{icon}</span>
                                    <p className="text-xs text-muted-foreground">{usage}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                        Phosphor Icons 기반으로 일관된 스트로크와 크기를 유지합니다.
                    </p>
                </div>
            </section>
        </>
    )
}
