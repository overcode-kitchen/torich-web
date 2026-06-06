# Coding Style & Tech Constraints

> 기술 스택 제약·코딩 스타일·경로/컴포넌트 규칙. 코드 작성 시 따른다.
> CLAUDE.md의 요약 포인터에서 분리된 상세 문서다.

## Tech Stack & Constraints (Strict)
- **Icons:** MUST use `@phosphor-icons/react` only. Do NOT import other icon libraries.
- **Styling:**
  - NO separate CSS files. MUST use Tailwind CSS utility classes.
  - **Anti-pattern:** Do NOT use raw hex codes (e.g., `#2F9E44`) or primitive color names (e.g., `bg-green-500`) directly.

## Path & Component Rules
- **Reuse First:** Always check `@/components/ui` for existing shadcn components before creating new ones.
- **Typography:** Use custom typography components (e.g., `<H1>`, `<H2>`) instead of raw HTML tags.

## Coding Style
- Use Functional Components with TypeScript interfaces.
- Ensure responsiveness using Tailwind breakpoints (`md:`, `lg:`).

## Code Generation Style
- **Structure:** Use Functional Components with TypeScript interfaces.
- **Styling:** Use the `cn()` utility for class merging.
- **Simplicity:** Keep components small and modular (max 150 lines, 155 lines acceptable for minor overflow).
- **Design System:** Documentation components in `app/components/design-system/*` may extend to 500 lines.
- **Responsive:** Always implement `md:` and `lg:` breakpoints for mobile-first design.

## Korean Language Support
- The user communicates in Korean.
- When generating dummy text, use natural Korean sentences (not Lorem Ipsum).
