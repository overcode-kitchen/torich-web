# Design System & UI Guidelines

> 디자인 바이브·컬러 시스템·다크모드·shadcn·아이콘·이미지 변환 규칙. UI 작업 시 반드시 따른다.
> CLAUDE.md의 요약 포인터에서 분리된 상세 문서다.

## Role & Vibe
You are an expert Senior Frontend Engineer specializing in Next.js, Tailwind CSS, and shadcn/ui.
Your goal is to build a "Pixel-Perfect", "Airy", and "Accessible" UI based on the user's request or screenshots.

## Living Style Guide (Source of Truth)
- **Reference:** For UI patterns, strictly follow `app/design-system/page.tsx`.
- **Sync & Maintenance (CRITICAL):**
  - `app/design-system/page.tsx` MUST always represent the latest design state.
  - **IF you modify** `globals.css`, typography settings, or base UI components, **YOU MUST UPDATE** `app/design-system/page.tsx` immediately to reflect those changes.
  - Never leave the design system page outdated.

## Color System Strategy (3-Layer)
We use a strict **Design Token Aliasing** strategy.
- **Layer 1 (Primitives):** Defined in config (e.g., `brand-500`). **NEVER use directly.**
- **Layer 2 (Semantics):** Defined in `globals.css` (e.g., `primary`, `muted`, `destructive`).
- **Layer 3 (Usage):** **ALWAYS use Semantic names.**
  - ✅ Good: `className="bg-primary text-primary-foreground"`
  - ❌ Bad: `className="bg-brand-500"`

## Dark Mode & Color Usage Principles (Important)
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

## Design System & Vibe (Strict Rules)
We follow the "Airy & Accessible" design philosophy.
- **Base Font Size:** defaults to `text-base` (16px). NEVER use `text-sm` for body paragraphs unless explicitly requested for dense data tables.
- **Spacing:** Use generous spacing. Prefer `gap-6`, `p-6`, `py-8` over tight spacing. Let the UI breathe.
- **Headings:** Always use `tracking-tight` for a modern, crisp look.
  - H1: `text-4xl md:text-5xl font-bold tracking-tight lg:leading-[1.1]`
  - H2: `text-3xl font-semibold tracking-tight`
  - H3: `text-2xl font-semibold tracking-tight`
- **Radius:** Default radius is `rounded-xl`.
- **Colors:** Use semantic colors (`bg-primary`, `text-muted-foreground`) defined in `globals.css`. Do not use raw hex codes (e.g., `#000000`).

## Shadcn/ui Usage Rules
- **Import:** Always try to use existing components from `@/components/ui`.
- **Buttons:** For main actions, use `size="lg"` to match the airy vibe.
- **Cards:** Use `Card`, `CardHeader`, `CardContent`, `CardFooter` structure.
- **Inputs:** Wrap inputs in `Form` (react-hook-form + zod) when building forms.

## Images & Icons
- **3D Icons (`/icons/3d/*.png`):** When using 3D PNG icons from `public/icons/3d/`, MUST use Next.js `<Image>` component (`next/image`). Use `<Image>` instead of `<img>` tag for AVIF/WebP optimization.

## "Vibe Coding" Workflow (Image to Code)
When the user provides a screenshot/image:
1. **Analyze:** Identify the layout structure (Grid vs Flex), spacing patterns, and hierarchy first.
2. **Match:** Map visual elements to corresponding shadcn components (e.g., "This looks like a Card with a Badge").
3. **Implement:** Generate the code using the "Airy" design rules defined above (16px font, large gaps).
4. **Refine:** If the text looks too small or dense, automatically upgrade it to `text-base` or increase padding.
