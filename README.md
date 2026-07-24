# 토리치 (Torich)

> 매달 투자, 까먹지 않게

적립식 투자 알림과 납입 관리를 한 곳에서. 매월 투자일을 알려주고, 완료 체크와 투자 현황을 한눈에 확인할 수 있는 서비스입니다.

- **웹**: [torich.vercel.app](https://torich.vercel.app)
- **iOS 앱**: 출시됨 (App Store)

## 주요 기능

- **매월 투자일 알림** — 푸시 알림으로 잊지 않게
- **납입 완료 체크** — 캘린더와 다가오는 투자 카드에서 한 번에
- **투자 현황 통계** — 예상 자산·수익 차트, 기간별 완료율
- **자동 수익률 갱신** — 종목별 시스템 수익률을 자동 반영
- **다크 모드 지원** — 라이트/다크/시스템 테마

## 기술 스택

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase · Capacitor (iOS).

자세한 내용은 [docs/coding-style.md](docs/coding-style.md) 참고.

## 시작하기

pnpm 전용 저장소입니다. 없다면 `npm install -g pnpm@10` 으로 설치하세요.

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000) 으로 접속.

### 환경변수

[`.env.example`](.env.example) 을 복사해 만듭니다. 키 구성은 같고 값만 다릅니다.

```bash
cp .env.example .env.development.local    # pnpm dev 에서만 읽힘
cp .env.example .env.production           # pnpm build:app 에서만 읽힘
```

> 🚫 **`.env.local` 은 만들지 마세요.** dev·build 양쪽에서 읽히고 `.env.production` 보다 우선해, 개발용 값이 앱 번들에 조용히 구워집니다. 경고 없이 빌드가 성공하므로 앱스토어에 올린 뒤에야 드러납니다. 이유와 우선순위는 [`.env.example`](.env.example) 상단에 적혀 있습니다.

각 키의 설명은 [`.env.example`](.env.example) 에 있습니다.

## 빌드

```bash
pnpm build       # 웹용 (Next.js 일반 빌드)
pnpm build:app   # iOS 앱용 (정적 export → Capacitor)
```

`build:app` 은 빌드 중 `app/api`, `app/auth` 폴더를 임시 백업 후 정적 export 를 수행합니다. 빌드가 중단된 경우 [CLAUDE.md](CLAUDE.md) 의 "빌드 복구" 섹션을 참고하세요.

## 문서

| 문서 | 내용 |
|------|------|
| [docs/workflow.md](docs/workflow.md) | **협업 흐름** — 이슈 등록부터 배포까지, 사람이 하는 일과 자동인 일 *(처음이라면 여기부터)* |
| [docs/service-analysis.md](docs/service-analysis.md) | **서비스 전체 분석** — 아키텍처·데이터모델·도메인·인프라 마스터 개요 |
| [CLAUDE.md](CLAUDE.md) | 아키텍처/디자인 시스템 규칙, Supabase 호환성 룰 (AI/개발자 공통) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 협업 규칙의 배경과 예외 (브랜치 전략, 환경 설정, 마이그레이션) |
| [docs/coding-style.md](docs/coding-style.md) | 기술 스택 제약·코딩 스타일·경로 규칙 |
| [docs/oauth-setup.md](docs/oauth-setup.md) | OAuth (Google/Apple) 설정 및 트러블슈팅 |
| [docs/notification-infra.md](docs/notification-infra.md) | 알림 웹훅 + pg_cron 인프라 |
| [docs/ga4-events.md](docs/ga4-events.md) | GA4 이벤트 설계 — "왜 이걸 측정하나" (개발자·PM) |
| [docs/ga4-console-guide.md](docs/ga4-console-guide.md) | GA4 콘솔 사용 가이드 — "켠 다음 어디 클릭해서 보나" (운영자·비개발자) |
| [docs/screens.md](docs/screens.md) | 화면별 기능명세서 |
| [docs/tori-raising/prd.md](docs/tori-raising/prd.md) | "토리 키우기" 기능 PRD |
