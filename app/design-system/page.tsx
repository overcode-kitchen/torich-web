"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Plus,
  CircleNotch,
  CaretDown,
  X,
  Info,
  Warning,
  Copy,
  Check,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export default function DesignSystemPage() {
  const tabs = [
    { id: "core", label: "기본" },
    { id: "patterns", label: "패턴" },
    { id: "tokens", label: "토큰" },
  ] as const

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("core")

  return (
    <main className="min-h-screen bg-coolgray-25">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-12">
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

        {activeTab === "core" && (
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
        )}

        {activeTab === "patterns" && (
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
        )}

        {activeTab === "tokens" && (
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
        )}

        {/* Footer */}
        <footer className="pt-4 text-center text-sm text-muted-foreground">
          /design-system — 내부 참고용
        </footer>
      </div>
    </main>
  )
}

function CopyButton({ value }: { value: string }) {
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

function NameLabel({
  label,
  token,
  usage,
}: {
  label: string
  token: string
  usage?: string
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <div>
        <span className="font-medium text-coolgray-700">{label}</span>
        <span className="text-coolgray-500"> · </span>
        <code className="text-coolgray-600">{token}</code>
        {usage && <p className="mt-0.5 text-coolgray-500">{usage}</p>}
      </div>
      <CopyButton value={token} />
    </div>
  )
}
