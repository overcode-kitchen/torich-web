# 토리치 프로젝트 가이드 (CLAUDE.md)

## Language
- Always respond in Korean (한국어로 응답)
- 커밋 메시지는 글로벌 규칙(`~/.claude/CLAUDE.md`)에 정의된 한글 prefix + 종결형 어미 형식을 따른다.
  - 예: `feat(login): 로그인 버튼 클릭 시 로딩 상태 표시 기능을 추가함`

---

# 운영 컨텍스트 (반드시 인지)

이 프로젝트의 코드 변경 영향 반경을 판단하기 위해 항상 아래 전제를 인지하고 작업한다.

- iOS 앱은 Capacitor **로컬 번들** 방식이다 (`webDir: 'out'`, 정적 export).
- `main` 브랜치 배포 시 **웹/서버는 즉시 반영되지만, 출시된 iOS 앱은 즉시 반영되지 않는다.** 사용자가 앱을 업데이트해야 한다.
- 클라이언트는 Supabase SDK로 **DB에 직접 접근**한다 → **Supabase 스키마가 곧 API**이고, 스키마 변경이 곧 Breaking Change이다.
- 운영 중에는 항상 **`구버전 앱 + 신버전 DB/API`** 조합이 존재한다고 가정한다.
- 머지 판단 기준: **"지금 운영 앱 사용자에게 안전한가?"**

---

# Supabase / API 호환성 (CRITICAL)

## Supabase 스키마 — Breaking Change 금지

- **금지**:
  - 기존 컬럼 삭제 / 이름 변경 / 타입 변경 (예: `TEXT` → `INTEGER`)
  - 기존 컬럼에 `NOT NULL` 제약 추가 (기존 행 파괴)
  - RLS 정책 강화 (구버전 앱의 조회 범위 축소)
- **허용**:
  - 새 컬럼 추가 (`DEFAULT` 값 필수)
  - 새 테이블 추가
  - `NOT NULL` → `NULL` 허용으로 완화
  - 인덱스 추가
- **구조 변경이 꼭 필요하면 순서 고정**:
  1. 새 컬럼/구조 **추가** (구 스펙 병행 유지)
  2. 앱 업데이트 배포 완료 확인
  3. 구 스펙 제거

## Next.js API Route — Breaking Change 금지

- **금지**: 기존 필드 삭제·이름변경·타입변경, 기존 엔드포인트 경로/요청 형식 변경
- **허용**: 새 필드 추가, 새 엔드포인트 추가

## 마이그레이션 파일

- 파일명은 **Supabase CLI 표준 타임스탬프** 형식 사용
  - 예: `20260426153000_add_market_to_records.sql`
- 마이그레이션 작성 후 반드시 **TypeScript 타입 재생성**:
  ```bash
  supabase gen types typescript --project-id <프로젝트ID> > types/database.types.ts
  ```

---

# 빌드 함정

## `build:app` 실패 시 복구

`npm run build:app` 은 빌드 중 `app/api`, `app/auth` 폴더를 `server-routes.backup/` 으로 임시 이동한다. 빌드가 중간에 실패하면 이 폴더가 복구되지 않은 채 남는다. 발견 즉시 수동 복구한다.

```bash
mv server-routes.backup/api app/api
mv server-routes.backup/auth app/auth
rm -rf server-routes.backup
```

## `capacitor.config.ts`의 `server.url` 커밋 금지

개발 시 임시로 주석 해제하는 `server.url` 이 **커밋된 채 배포되면 운영 앱이 로컬 서버를 바라본다.** PR 머지 전 반드시 diff 확인.

```ts
server: {
  // 절대 주석 해제된 채로 커밋하지 말 것
  // url: 'http://localhost:3000',
}
```

---

# Edge Function 배포

`supabase/functions/` 의 함수는 코드 변경 후 **별도 배포 명령으로 반영된다.** 함수 변경이 포함된 작업은 배포까지 완료해야 끝난 것이다.

```bash
supabase functions deploy <함수명>

# 예시
# supabase functions deploy schedule-notification
# supabase functions deploy send-push
```

---

# Project Context
You are an expert Frontend Engineer specializing in Next.js (App Router), Tailwind CSS, and shadcn/ui.

---

# Torich Project Architecture Rules (CRITICAL)

## File Structure
```
app/
  hooks/              # Custom Hooks (business logic only)
  components/         # Reusable components (UI only)
    {domain}Sections/ # Page-specific section components
  {page}/
    page.tsx          # Composition only (target: 100-150 lines)
```

## Naming Conventions
- **Hooks**: `use{Domain}Data`, `use{Domain}Calculations`, `use{Feature}`
- **Components**: `{Feature}Section`, `{Feature}Field`, `{Feature}Sheet`
- **Props**: `{ComponentName}Props`

## Core Patterns (Mandatory)

### 1. Custom Hooks - Logic Separation
- **Rule**: One hook = One responsibility (separate data fetching / calculations / UI state)
- **File Size**: Max 150 lines (flexible: 155 lines acceptable for minor overflow)
- **Reference Files**:
  - Data fetching: `app/hooks/useStatsData.ts`
  - Calculations: `app/hooks/useStatsCalculations.ts`
  - UI state: `app/hooks/useInvestmentFilter.ts`

### 2. Presentational Components - UI Only
- **Rule**: Receive props and render only
- **Forbidden**: No useState/useEffect allowed
- **File Size**: Max 150 lines
- **Exception**: Design System documentation components (`app/components/design-system/*`) may exceed 150 lines up to 500 lines for comprehensive documentation purposes
- **Reference Files**:
  - Reusable component: `app/components/InvestmentField.tsx`
  - Section component: `app/components/InvestmentDetailSections/ProgressSection.tsx`
  - Design system: `app/components/design-system/CoreSection.tsx` (exception case)

### 3. Container Components - Composition Only
- **Rule**: Use hooks for logic → render section components
- **File Size**: Max 150 lines (flexible: 155 lines acceptable for minor overflow)
- **Reference Files**:
  - `app/stats/page.tsx`
  - `app/settings/page.tsx`

### 4. DRY Principle
- **Threshold**: If pattern repeats 3+ times → extract to component/hook immediately
- **Reference**: `app/components/InvestmentField.tsx`

### 5. Minimize Props Drilling
- **Limit**: Max 3 levels deep
- **Solution**: Generate data at intermediate levels using hooks

## Absolute Prohibitions
- ❌ NEVER write useState/useEffect directly in page files
- ❌ NEVER include logic in Presentational Components
- ❌ NEVER leave files exceeding 300 lines (exception: design system documentation components up to 500 lines)
- ❌ NEVER repeat code 3+ times without extraction
- ❌ NEVER drill props beyond 4 levels

## File Size Guidelines (Flexible Enforcement)
- **Strict Limit**: 150 lines for components/hooks/pages
- **Acceptable Overflow**: Up to 155 lines (5 lines tolerance) - minor cleanup recommended but not blocking
- **Design System Exception**: `app/components/design-system/*` files may extend to 500 lines for comprehensive documentation
- **Priority**: Files exceeding limits should be refactored, but 5-line overflow is acceptable for practical development
- **Note**: If a hook exceeds 150 lines significantly (e.g., 180+ lines), consider extracting helper functions to utility files or splitting into multiple focused hooks

## New Page Creation Checklist
When creating a new page, follow this order:
1. `app/hooks/use{Domain}Data.ts` - data fetching
2. `app/hooks/use{Domain}Calculations.ts` - calculations (if needed)
3. `app/components/{Feature}Section.tsx` - section components
4. `app/{page}/page.tsx` - composition only (max 150 lines)

## Refactoring Order
When improving existing files:
1. Extract logic → Custom Hooks
2. Remove duplication → Reusable Components
3. Separate sections → Presentational Components
4. Clean up page → Leave composition logic only

---

# Tech Stack & Constraints (Strict)
- **Icons:** MUST use `@phosphor-icons/react` only. Do NOT import other icon libraries.
- **Styling:**
  - NO separate CSS files. MUST use Tailwind CSS utility classes.
  - **Anti-pattern:** Do NOT use raw hex codes (e.g., `#2F9E44`) or primitive color names (e.g., `bg-green-500`) directly.

---

# Path & Component Rules
- **Reuse First:** Always check `@/components/ui` for existing shadcn components before creating new ones.
- **Typography:** Use custom typography components (e.g., `<H1>`, `<H2>`) instead of raw HTML tags.

---

# Living Style Guide (Source of Truth)
- **Reference:** For UI patterns, strictly follow `app/design-system/page.tsx`.
- **Sync & Maintenance (CRITICAL):**
  - `app/design-system/page.tsx` MUST always represent the latest design state.
  - **IF you modify** `globals.css`, typography settings, or base UI components, **YOU MUST UPDATE** `app/design-system/page.tsx` immediately to reflect those changes.
  - Never leave the design system page outdated.

---

# Color System Strategy (3-Layer)
We use a strict **Design Token Aliasing** strategy.
- **Layer 1 (Primitives):** Defined in config (e.g., `brand-500`). **NEVER use directly.**
- **Layer 2 (Semantics):** Defined in `globals.css` (e.g., `primary`, `muted`, `destructive`).
- **Layer 3 (Usage):** **ALWAYS use Semantic names.**
  - ✅ Good: `className="bg-primary text-primary-foreground"`
  - ❌ Bad: `className="bg-brand-500"`

---

# Dark Mode & Color Usage Principles (Important)
- **Background & Cards**
  - ✅ Main background: `bg-background` / `bg-surface`
  - ✅ Cards/Modals/Forms: `bg-card`
  - ❌ Forbidden: Direct `bg-white` usage (exception: external logo/brand guideline enforcement)
- **Text**
  - ✅ Default text: `text-foreground`
  - ✅ Secondary text: `text-muted-foreground`, `text-foreground-soft`, `text-foreground-subtle`
  - ❌ Forbidden: `text-black` / arbitrary hex text colors
- **Accent/Brand Colors**
  - ✅ Use `bg-primary`, `text-primary`/`text-brand-600` ONLY in "brand experience" areas (main CTA, brand story)
  - ❌ Avoid excessive brand usage in informational UI (stats/charts/forms) - keep to coolgray tones
- **Charts (Recharts, etc.)**
  - ✅ Read colors from CSS variables in `globals.css` using `getComputedStyle`
    - e.g., `--chart-profit`, `--chart-principal`, `--border-subtle`, `--foreground-subtle`
  - ❌ Forbidden: Hardcoding hex values (`#02c463`, `#9C9EA6`) for axes/grids/lines/bars
  - ✅ If fallback needed, use only "explainable" values matching semantic tokens (e.g., coolgray)
- **Stats/Analytics Screens (e.g., `app/stats/page.tsx`)**
  - Base rule: **Build hierarchy within coolgray layer as much as possible**
  - Primary info (large numbers, key KPIs): emphasize with `text-foreground` + font size/weight
  - Charts/progress bars: use gray tones at `foreground-soft`/`border-subtle` level for supporting role
  - Use brand green ONLY at **one or two critical points** when truly necessary; default to coolgray design

---

# Coding Style
- Use Functional Components with TypeScript interfaces.
- Ensure responsiveness using Tailwind breakpoints (`md:`, `lg:`).

---

# Role & Vibe
You are an expert Senior Frontend Engineer specializing in Next.js, Tailwind CSS, and shadcn/ui.
Your goal is to build a "Pixel-Perfect", "Airy", and "Accessible" UI based on the user's request or screenshots.

---

# Design System & Vibe (Strict Rules)
We follow the "Airy & Accessible" design philosophy.
- **Base Font Size:** defaults to `text-base` (16px). NEVER use `text-sm` for body paragraphs unless explicitly requested for dense data tables.
- **Spacing:** Use generous spacing. Prefer `gap-6`, `p-6`, `py-8` over tight spacing. Let the UI breathe.
- **Headings:** Always use `tracking-tight` for a modern, crisp look.
  - H1: `text-4xl md:text-5xl font-bold tracking-tight lg:leading-[1.1]`
  - H2: `text-3xl font-semibold tracking-tight`
  - H3: `text-2xl font-semibold tracking-tight`
- **Radius:** Default radius is `rounded-xl`.
- **Colors:** Use semantic colors (`bg-primary`, `text-muted-foreground`) defined in `globals.css`. Do not use raw hex codes (e.g., `#000000`).

---

# Shadcn/ui Usage Rules
- **Import:** Always try to use existing components from `@/components/ui`.
- **Buttons:** For main actions, use `size="lg"` to match the airy vibe.
- **Cards:** Use `Card`, `CardHeader`, `CardContent`, `CardFooter` structure.
- **Inputs:** Wrap inputs in `Form` (react-hook-form + zod) when building forms.

---

# Images & Icons
- **3D Icons (`/icons/3d/*.png`):** When using 3D PNG icons from `public/icons/3d/`, MUST use Next.js `<Image>` component (`next/image`). Use `<Image>` instead of `<img>` tag for AVIF/WebP optimization.

---

# Code Generation Style
- **Structure:** Use Functional Components with TypeScript interfaces.
- **Styling:** Use the `cn()` utility for class merging.
- **Simplicity:** Keep components small and modular (max 150 lines, 155 lines acceptable for minor overflow).
- **Design System:** Documentation components in `app/components/design-system/*` may extend to 500 lines.
- **Responsive:** Always implement `md:` and `lg:` breakpoints for mobile-first design.

---

# "Vibe Coding" Workflow (Image to Code)
When the user provides a screenshot/image:
1. **Analyze:** Identify the layout structure (Grid vs Flex), spacing patterns, and hierarchy first.
2. **Match:** Map visual elements to corresponding shadcn components (e.g., "This looks like a Card with a Badge").
3. **Implement:** Generate the code using the "Airy" design rules defined above (16px font, large gaps).
4. **Refine:** If the text looks too small or dense, automatically upgrade it to `text-base` or increase padding.

---

# Korean Language Support
- The user communicates in Korean.
- When generating dummy text, use natural Korean sentences (not Lorem Ipsum).
