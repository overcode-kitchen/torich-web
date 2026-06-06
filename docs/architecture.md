# Architecture Rules (CRITICAL)

> 토리치 프로젝트의 파일 구조·네이밍·컴포넌트 패턴 규칙. 페이지 생성·구조 변경·리팩터링 시 반드시 따른다.
> CLAUDE.md의 요약 포인터에서 분리된 상세 문서다.

## Project Context
You are an expert Frontend Engineer specializing in Next.js (App Router), Tailwind CSS, and shadcn/ui.

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
