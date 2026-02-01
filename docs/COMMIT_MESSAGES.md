# 커밋 메시지 (기능별 분리)

## 1) UI 의존성 추가

```
chore(ui): shadcn-studio 레지스트리 및 date-picker-01 의존성 추가

- components.json: @ss-components, @shadcn-studio 레지스트리 등록
- date-picker-01 설치로 추가된 컴포넌트:
  - components/ui/calendar.tsx
  - components/ui/popover.tsx
  - components/ui/label.tsx
  - components/shadcn-studio/date-picker/date-picker-01.tsx
- components/ui/button.tsx shadcn 업데이트 반영
- package.json, package-lock.json: react-day-picker 등 의존성 추가
```

**스테이징 예시:**
```bash
git add components.json components/ui/button.tsx components/ui/calendar.tsx components/ui/label.tsx components/ui/popover.tsx components/shadcn-studio/ package.json package-lock.json
git commit -m "chore(ui): shadcn-studio 레지스트리 및 date-picker-01 의존성 추가

- components.json: @ss-components, @shadcn-studio 레지스트리 등록
- date-picker-01 설치로 추가된 컴포넌트:
  - components/ui/calendar.tsx
  - components/ui/popover.tsx
  - components/ui/label.tsx
  - components/shadcn-studio/date-picker/date-picker-01.tsx
- components/ui/button.tsx shadcn 업데이트 반영
- package.json, package-lock.json: react-day-picker 등 의존성 추가"
```

---

## 2) 투자 추가 페이지 날짜 선택 UI 교체

```
feat(add): 투자 시작일을 date-picker-01(캘린더 팝오버)로 교체

- 투자 추가 페이지: 기존 <input type="date"> 제거
- Popover + Calendar 기반 날짜 선택기 적용
- startDate state를 Date 객체로 관리, 저장 시 YYYY-MM-DD 문자열로 변환
- 선택 날짜 표시: 한국어 로케일 (예: 2025년 1월 15일)
```

**스테이징 예시:**
```bash
git add app/add/page.tsx
git commit -m "feat(add): 투자 시작일을 date-picker-01(캘린더 팝오버)로 교체

- 투자 추가 페이지: 기존 <input type="date"> 제거
- Popover + Calendar 기반 날짜 선택기 적용
- startDate state를 Date 객체로 관리, 저장 시 YYYY-MM-DD 문자열로 변환
- 선택 날짜 표시: 한국어 로케일 (예: 2025년 1월 15일)"
```

---

## 한 번에 적용하려면

```bash
# 1번 커밋
git add components.json components/ui/button.tsx components/ui/calendar.tsx components/ui/label.tsx components/ui/popover.tsx components/shadcn-studio/ package.json package-lock.json
git commit -m "chore(ui): shadcn-studio 레지스트리 및 date-picker-01 의존성 추가

- components.json: @ss-components, @shadcn-studio 레지스트리 등록
- date-picker-01 설치로 추가된 컴포넌트: calendar, popover, label, shadcn-studio/date-picker-01
- components/ui/button.tsx shadcn 업데이트 반영
- package.json, package-lock.json: react-day-picker 등 의존성 추가"

# 2번 커밋
git add app/add/page.tsx
git commit -m "feat(add): 투자 시작일을 date-picker-01(캘린더 팝오버)로 교체

- 투자 추가 페이지: 기존 <input type="date"> 제거
- Popover + Calendar 기반 날짜 선택기 적용
- startDate state를 Date 객체로 관리, 저장 시 YYYY-MM-DD 문자열로 변환
- 선택 날짜 표시: 한국어 로케일 (예: 2025년 1월 15일)"
```
