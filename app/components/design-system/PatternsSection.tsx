"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
    Plus,
    CircleNotch,
    CaretDown,
    X,
    Info,
    Warning,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

import { NameLabel } from "./DesignSystemShared"

export function PatternsSection() {
    return (
        <>
            {/* 상태 피드백 패턴 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    상태 패턴
                </h2>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <NameLabel label="상태 · 정보" token="pattern-alert-info" />
                        <Alert>
                            <Info className="text-primary" />
                            <AlertTitle>정보 메시지</AlertTitle>
                            <AlertDescription>기본 상태 안내에 사용하는 메시지 예시입니다.</AlertDescription>
                        </Alert>
                    </div>
                    <div className="space-y-2">
                        <NameLabel label="상태 · 경고" token="pattern-alert-warning" />
                        <Alert variant="destructive">
                            <Warning className="text-destructive" />
                            <AlertTitle>경고 메시지</AlertTitle>
                            <AlertDescription>유효성 오류나 위험 상황을 강조할 때 사용합니다.</AlertDescription>
                        </Alert>
                    </div>
                    <div className="rounded-xl border border-coolgray-200 bg-white p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-coolgray-900 mb-1">상태 메시지 가이드</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>텍스트는 가능한 한 한 줄로 유지하고 중요도 순으로 배치합니다.</li>
                            <li>아이콘은 16px 크기, 동일한 스트로크 두께를 유지합니다.</li>
                            <li>토스트, 스켈레톤 등 다른 UI 상태도 동일한 색상 체계를 공유합니다.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 리스트 패턴 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    리스트 패턴
                </h2>
                <div className="rounded-xl border border-coolgray-200 bg-white p-6 space-y-4">
                    <NameLabel label="리스트 · 카드" token="pattern-list-card" />
                    <div className="space-y-3">
                        {["리스트 아이템입니다.", "두 번째 아이템입니다.", "세 번째 아이템입니다."].map((item) => (
                            <div
                                key={item}
                                className="flex items-center justify-between rounded-2xl border border-coolgray-100 bg-white px-4 py-3"
                            >
                                <div>
                                    <p className="text-base font-medium text-coolgray-900">{item}</p>
                                    <p className="text-sm text-muted-foreground">보조 설명 텍스트입니다.</p>
                                </div>
                                <Button variant="ghost" size="sm">
                                    보기
                                </Button>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-coolgray-900 mb-1">리스트 가이드</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>아이템 간 간격은 12~16px을 유지합니다.</li>
                            <li>필요 시 우측에 보조 액션 버튼을 배치합니다.</li>
                            <li>구분선은 <code>border-border-subtle</code>를 사용합니다.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 모달 패턴 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    모달 패턴
                </h2>
                <div className="rounded-xl border border-coolgray-200 bg-white p-6">
                    <NameLabel label="모달 · 기본" token="pattern-modal-base" />
                    <div className="rounded-2xl border border-border bg-white p-6 shadow-md">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-lg font-semibold text-coolgray-900">모달 제목입니다.</p>
                                <p className="text-base text-muted-foreground mt-1">
                                    모달 본문 설명 텍스트입니다. 한두 줄로 내용을 요약합니다.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="rounded-full p-2 text-coolgray-500 hover:text-coolgray-900"
                                aria-label="닫기"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Button variant="outline">취소</Button>
                            <Button>확인</Button>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                        모달은 `rounded-2xl`, `shadow-md`를 기본으로 사용하고 하단에 CTA 버튼을 배치합니다.
                    </p>
                </div>
            </section>

            {/* 폼 패턴 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    폼 패턴
                </h2>
                <div className="rounded-xl border border-coolgray-200 bg-white p-6 space-y-6">
                    <NameLabel label="폼 · 기본" token="pattern-form-base" />
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-coolgray-900" htmlFor="sample-input">
                                입력 필드 라벨
                            </label>
                            <input
                                id="sample-input"
                                type="text"
                                placeholder="입력 자리 표시자입니다."
                                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-coolgray-900 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                            />
                            <p className="text-xs text-muted-foreground">필요 시 보조 설명 텍스트를 추가합니다.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-coolgray-900" htmlFor="sample-select">
                                    선택 필드
                                </label>
                                <select
                                    id="sample-select"
                                    className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-coolgray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                                    defaultValue="placeholder"
                                >
                                    <option value="placeholder" disabled>
                                        선택 옵션입니다.
                                    </option>
                                    <option value="option-1">옵션 1</option>
                                    <option value="option-2">옵션 2</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-coolgray-900" htmlFor="sample-toggle">
                                    체크박스
                                </label>
                                <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
                                    <input
                                        id="sample-toggle"
                                        type="checkbox"
                                        className="size-5 rounded-md border-border"
                                    />
                                    <span className="text-base text-coolgray-900">옵션 이름입니다.</span>
                                </div>
                            </div>
                        </div>
                        <Button type="submit" size="lg" className="w-full sm:w-auto">
                            폼 제출 버튼
                        </Button>
                    </form>
                    <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-coolgray-900 mb-1">폼 구성 원칙</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>라벨은 항상 필드 위에 위치하고 16px 이상의 글자 크기를 유지합니다.</li>
                            <li>입력 요소는 최소 48px 높이를 권장합니다.</li>
                            <li>에러 메시지는 상태 패턴과 동일한 색상 체계를 사용합니다.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 로딩 패턴 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    로딩 패턴
                </h2>
                <div className="rounded-xl border border-coolgray-200 bg-white p-6 space-y-6">
                    <div className="space-y-2">
                        <NameLabel label="로딩 · 인라인" token="pattern-loading-inline" />
                        <div className="flex items-center gap-3 rounded-2xl bg-coolgray-25 px-4 py-3">
                            <CircleNotch className="size-5 animate-spin text-brand-600" />
                            <span className="text-base text-coolgray-700">목록을 불러오는 중입니다.</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <NameLabel label="로딩 · 스켈레톤" token="pattern-loading-card" />
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="rounded-2xl border border-border bg-muted/30 p-4">
                                    <div className="h-4 w-20 rounded-full bg-coolgray-100" />
                                    <div className="mt-3 h-3 w-full rounded-full bg-coolgray-100" />
                                    <div className="mt-2 h-3 w-2/3 rounded-full bg-coolgray-100" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <NameLabel label="로딩 · 버튼" token="pattern-loading-button" />
                        <Button size="lg" disabled className="w-full sm:w-auto">
                            <CircleNotch className="size-4 animate-spin" />
                            처리 중입니다
                        </Button>
                    </div>
                </div>
            </section>

            {/* 빈 상태 패턴 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    빈 상태 패턴
                </h2>
                <div className="space-y-2">
                    <NameLabel label="빈 상태 · 기본" token="pattern-empty-default" />
                    <div className="rounded-xl border border-coolgray-200 bg-white p-6 text-center space-y-4">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-coolgray-25 text-coolgray-700">
                            <Plus className="size-6" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-coolgray-900">데이터가 없습니다.</p>
                            <p className="text-base text-muted-foreground mt-1">
                                빈 상태에서는 다음 행동을 안내하는 버튼을 함께 제공합니다.
                            </p>
                        </div>
                        <Button size="lg">새 항목 추가</Button>
                    </div>
                </div>
            </section>

            {/* 배지 · 태그 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    배지 · 태그
                </h2>
                <div className="rounded-xl border border-coolgray-200 bg-white p-6">
                    <div className="flex flex-wrap gap-6">
                        {[
                            { label: "상태 배지", className: "bg-coolgray-900 text-white", token: "badge-solid" },
                            { label: "중립 태그", className: "bg-coolgray-25 text-coolgray-700", token: "badge-neutral" },
                            { label: "강조 태그", className: "bg-brand-100 text-brand-700", token: "badge-accent" },
                            { label: "아웃라인 태그", className: "border border-border text-coolgray-700", token: "badge-outline" },
                        ].map(({ label, className, token }) => (
                            <div key={token} className="space-y-2">
                                <NameLabel label={label} token={token} />
                                <span
                                    className={cn(
                                        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                                        className
                                    )}
                                >
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 토스트 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    토스트
                </h2>
                <div className="space-y-2">
                    <NameLabel label="토스트 · 기본" token="pattern-toast-base" />
                    <div className="rounded-xl border border-coolgray-200 bg-white px-4 py-3 shadow-sm flex items-center gap-3">
                        <span className="text-lg">🐿️</span>
                        <div>
                            <p className="text-sm font-medium text-coolgray-900">알림 제목입니다.</p>
                            <p className="text-xs text-muted-foreground">토스트 메시지 예시입니다.</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        토스트는 화면 상단 중앙 혹은 하단에 표시되며 3~4초 후 자동 종료됩니다.
                    </p>
                </div>
            </section>

            {/* 드롭다운 · 툴팁 */}
            <section className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                    드롭다운 · 툴팁
                </h2>
                <div className="rounded-xl border border-coolgray-200 bg-white p-6 space-y-4">
                    <div className="space-y-2">
                        <NameLabel label="드롭다운 · 기본" token="pattern-dropdown-base" />
                        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-coolgray-700">
                            드롭다운 버튼
                            <CaretDown className="size-4" />
                        </div>
                        <div className="w-48 rounded-xl border border-border bg-white p-2 shadow-sm">
                            {["옵션 1", "옵션 2", "옵션 3"].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-lg px-3 py-2 text-sm text-coolgray-700 hover:bg-coolgray-25"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <NameLabel label="툴팁 · 기본" token="pattern-tooltip-base" />
                        <div className="inline-flex items-center gap-2 rounded-full bg-coolgray-900 px-3 py-1 text-xs text-white">
                            툴팁 안내 문장입니다.
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
