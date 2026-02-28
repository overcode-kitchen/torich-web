# Apple 로그인 도입 계획 (iOS 정책 대응)

iOS 앱에서 서드파티 로그인(Google)을 제공하는 경우, Apple 로그인을 필수로 제공해야 합니다.  
현재 Supabase Auth + Google OAuth 구조에 **Apple Sign In**을 추가하는 계획입니다.

---

## 1. 전체 흐름 요약

- **웹**: Supabase `signInWithOAuth({ provider: 'apple' })` → Apple OAuth → `/auth/callback`에서 `exchangeCodeForSession` (기존과 동일).
- **네이티브(iOS)**: 구글과 동일하게 `signInWithOAuth` + `skipBrowserRedirect: true` + `Browser.open(data.url)` → Apple 완료 후 `torich://login-callback?code=...` → `AuthDeepLinkHandler`에서 `exchangeCodeForSession`.
- 기존 **Auth 콜백 라우트**와 **딥링크 핸들러**를 그대로 활용하며, **Apple용 새 라우트는 필요 없음**.

---

## 2. Apple Developer Console 설정 (순서대로)

> [Apple Developer](https://developer.apple.com/) 계정 필요 (유료)

### 2.1 Team ID 확인

1. [Apple Developer Console](https://developer.apple.com/account) 로그인
2. 우측 상단 **Membership** → **Team ID** (10자 영숫자) 복사해 두기  
   → Supabase Apple 설정 시 사용

### 2.2 App ID에 Sign in with Apple 활성화

1. **Certificates, Identifiers & Profiles** → **Identifiers**
2. 앱의 **App ID** (Bundle ID) 선택 또는 새로 생성  
   - 예: `com.yourcompany.torich` (실제 앱 번들 ID 사용)
3. **Capabilities**에서 **Sign in with Apple** 체크
4. **Save**

### 2.3 Services ID 생성 (OAuth용)

1. **Identifiers** → **+** → **Services IDs** 선택 → Continue
2. **Description**: 예) `Torich Web Auth`
3. **Identifier**: 예) `com.yourcompany.torich.auth` (역도메인 형식, 나중에 Supabase Client ID로 사용)
4. **Sign In with Apple** 체크 → **Configure**
   - **Primary App ID**: 위에서 만든 App ID 선택
   - **Domains and Subdomains**:  
     `xxxxxxxxxxxx.supabase.co` (Supabase 프로젝트 URL의 호스트만, 프로토콜 제외)
   - **Return URLs**:  
     `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback`  
     (Supabase Dashboard → Settings → API → Project URL 참고)
5. **Save** → **Continue** → **Register**

### 2.4 Sign in with Apple 키 생성 (Secret 생성용)

1. **Certificates, Identifiers & Profiles** → **Keys** → **+**
2. **Key Name**: 예) `Torich Apple Sign In Key`
3. **Sign in with Apple** 체크 → **Configure** → 위에서 만든 **Primary App ID** 선택 → **Save**
4. **Continue** → **Register**
5. **Download**로 `.p8` 파일 다운로드 (한 번만 가능, 안전하게 보관)
6. **Key ID** (10자) 복사  
7. **.p8 파일 내용**을 열어서 나중에 Supabase용 Secret 생성 시 사용

> ⚠️ **.p8 파일은 분실 시 재발급만 가능**하므로 백업 보관. 유출 시 Apple에서 해당 키 revoke 후 새 키 생성 필요.

### 2.5 (선택) 이메일 프라이버시 – 이메일 릴레이

사용자가 “이메일 숨기기”를 선택하면 Apple이 릴레이 이메일을 씁니다.

1. **Certificates, Identifiers & Profiles** → **Identifiers** → **Services ID** 선택
2. **Sign In with Apple** 설정에서 **Email Communication** 등 필요 시 설정  
   (Supabase는 별도 서버 알림 엔드포인트를 요구하지 않으므로, 기본만 해도 동작)

---

## 3. Supabase Dashboard 설정 (순서대로)

### 3.1 프로젝트 URL 확인

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. **Settings** → **API**  
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`  
   → Apple Services ID의 **Domains and Subdomains** / **Return URLs**에 이미 위 2.3에서 넣었는지 확인

### 3.2 Redirect URLs에 딥링크 추가 (이미 있으면 생략)

1. **Authentication** → **URL Configuration**
2. **Redirect URLs**에 다음이 있는지 확인, 없으면 추가:
   - `torich://login-callback`
   - 또는 `torich://**`  
   (네이티브 앱에서 Apple 로그인 후 돌아올 URL)

### 3.3 Apple Provider 활성화 및 값 입력

1. **Authentication** → **Providers** → **Apple** 선택
2. **Enable Sign in with Apple** 켬
3. 아래 값 입력:

**iOS 네이티브 Apple 로그인**을 쓰는 경우, id_token의 `aud`가 **Bundle ID**이므로 Supabase **Client ID는 반드시 Bundle ID**로 둡니다.

| 필드 | 값 | 비고 |
|------|-----|------|
| **Client ID** | `com.overcode.torich` | **Bundle ID** (네이티브용). 웹 전용이면 Services ID 사용 가능 |
| **Secret** | (아래 3.4에서 생성한 값, Client ID=Bundle ID로 생성) | 6개월마다 갱신 필요 |

> ⚠️ **Unacceptable audience in id_token** 오류가 나면: Supabase Apple **Client ID**가 지금 **Services ID**로 되어 있는지 확인하세요. 네이티브에서는 **Bundle ID**(`com.overcode.torich`)로 바꾸고, Secret도 **동일한 Bundle ID**로 다시 생성해 넣어야 합니다.

### 3.4 Apple Client Secret 생성

Apple은 **Client Secret**을 직접 주지 않고, **Team ID + Key ID + .p8 + Client ID**로 생성합니다.

1. Supabase 문서의 **공식 도구** 사용 권장:  
   [Generate Apple client secret](https://supabase.com/docs/guides/auth/social-login/auth-apple#configuration)  
   (Safari에서는 동작하지 않을 수 있으므로 Chrome 등 사용)
2. 다음을 입력:
   - **Team ID**: 2.1에서 복사
   - **Key ID**: 2.4에서 복사
   - **Client ID**: **Bundle ID** `com.overcode.torich` (네이티브 로그인용으로 Supabase에 넣은 값과 동일)
   - **Private Key**: .p8 파일 내용 전체 붙여넣기
3. 생성된 **Secret**을 복사 → Supabase **Apple** Provider **Secret** 필드에 붙여넣기
4. **Save**

> ⚠️ **Secret은 6개월마다 갱신**해야 합니다. 갱신 시 같은 방식으로 새 Secret 생성 후 Supabase에 다시 입력. 달력 알림 설정 권장.

---

## 4. 앱 코드 변경 계획

### 4.1 `useLoginAuth` 훅

- **파일**: `app/hooks/auth/useLoginAuth.ts`
- **추가**: `handleAppleLogin` 함수
  - **웹**: `signInWithOAuth({ provider: 'apple', options: { redirectTo: `${location.origin}/auth/callback` } })`
  - **네이티브**: `signInWithOAuth({ provider: 'apple', options: { redirectTo: 'torich://login-callback', skipBrowserRedirect: true } })` 후 `data.url`로 `Browser.open({ url: data.url })`
- **반환**: `{ handleGoogleLogin, handleAppleLogin, handleTestLogin, ... }` 형태로 노출

### 4.2 로그인 UI

- **파일**: `app/components/LoginSections/LoginView.tsx`
- **추가**:  
  - `onAppleLogin: () => void` props  
  - “Apple로 계속하기” 버튼 (구글 버튼 아래 또는 위, 디자인에 맞게)
- **파일**: `app/login/page.tsx`  
  - `handleAppleLogin`을 `LoginView`의 `onAppleLogin`에 연결

### 4.3 공통 처리 (추가 작업 최소화)

- **`/auth/callback`**: 기존 그대로 사용 (provider 구분 없이 `code`만 처리).
- **`AuthDeepLinkHandler`**: 기존 그대로 사용 (`torich://login-callback?code=...` → `exchangeCodeForSession`).
- **Capacitor / Info.plist**: URL 스킴 `torich` 이미 등록되어 있으면 변경 없음.

### 4.4 (선택) 이름 저장

- Apple OAuth 플로우에서는 **첫 로그인 시에만** 이름을 받을 수 있고, Supabase로 전달되지 않을 수 있음.
- 이름이 필요하면:  
  - 프로필/온보딩 화면에서 이름 입력받기, 또는  
  - Supabase `auth.users` 메타데이터를 `updateUser`로 갱신하는 로직을 콜백/딥링크 처리 직후에 추가.

---

## 5. 체크리스트 (설정 순서 요약)

| 순서 | 담당 | 작업 |
|------|------|------|
| 1 | Apple | Team ID 확인 |
| 2 | Apple | App ID에 Sign in with Apple Capability 추가 |
| 3 | Apple | Services ID 생성 및 Domains/Return URL에 Supabase URL 등록 |
| 4 | Apple | Sign in with Apple 키 생성, .p8 다운로드, Key ID 복사 |
| 5 | Supabase | Redirect URLs에 `torich://login-callback` 확인/추가 |
| 6 | Supabase | Apple Provider 활성화, Client ID(Services ID) 입력 |
| 7 | Supabase | 도구로 Secret 생성 후 Supabase Apple Secret에 입력 |
| 8 | 앱 | `useLoginAuth`에 `handleAppleLogin` 추가 |
| 9 | 앱 | `LoginView`에 Apple 버튼 및 `onAppleLogin` 연결 |
| 10 | (선택) | 6개월 후 Secret 갱신 알림 설정 |

---

## 6. 트러블슈팅 (iOS 네이티브)

### 오류 1000 (AuthorizationError error 1000)

- **원인**: Sign in with Apple capability/entitlements 미설정.
- **조치**:
  1. **Apple Developer**: App ID에 **Sign in with Apple** capability 체크 후 저장.
  2. **Xcode**: 타겟 → **Signing & Capabilities** → **+ Capability** → **Sign in with Apple** 추가.
  3. **Entitlements**: `ios/App/App/App.entitlements`에 `com.apple.developer.applesignin` = `Default` 포함 여부 확인 (이미 추가되어 있으면 생략).
  4. 앱 완전 종료 후 재빌드 및 재실행.

### 콘솔에 빈 객체 `{}`만 보일 때

- Apple/네이티브 브릿지 오류가 직렬화되지 않아 `{}`로 보일 수 있음. 메시지에 `1000` 또는 `AuthorizationError`가 있으면 위 오류 1000과 동일하게 capability/entitlements를 점검하세요.

### Nonces mismatch

- **원인**: Apple은 요청 시 **SHA-256 해시된 nonce**만 받고, id_token의 nonce 클레임에는 그 해시가 들어갑니다. Supabase는 **원본(raw) nonce**를 받아 해시한 뒤 토큰과 비교합니다. raw를 Apple에 보내거나, 해시를 Supabase에 보내면 검증이 실패합니다.
- **조치**: 앱에서는 (1) raw nonce 생성 → (2) SHA-256 후 base64url 인코딩한 값을 Apple 플러그인에 전달, (3) **raw nonce**만 Supabase `signInWithIdToken({ nonce: rawNonce })`에 전달하도록 구현되어 있습니다. 이 방식으로 수정 후 재시도하세요.

### undefined is not an object (evaluating 'crypto.subtle.digest')

- **원인**: iOS WebView에서 HTTP로 로드되면 **보안 컨텍스트**가 아니어서 `crypto.subtle`가 비활성화됩니다.
- **조치**: 앱에서 `crypto.subtle`가 없을 때 **js-sha256** 패키지로 SHA-256 해시를 계산하도록 폴백해 두었습니다. 별도 설정 없이 동작합니다.

### Unacceptable audience in id_token: [com.overcode.torich]

- **원인**: 네이티브 Apple 로그인 시 id_token의 `aud`(audience)가 **Bundle ID**인데, Supabase Apple Provider의 **Client ID**가 **Services ID**로 되어 있을 때 발생합니다.
- **조치**:
  1. Supabase **Authentication** → **Providers** → **Apple** 에서 **Client ID**를 **Bundle ID** `com.overcode.torich` 로 변경합니다.
  2. Apple Client Secret은 **동일한 Client ID(Bundle ID)** 로 다시 생성합니다.  
     [Generate Apple client secret](https://supabase.com/docs/guides/auth/social-login/auth-apple#configuration) 에서 Client ID에 `com.overcode.torich` 를 넣고 생성한 뒤, Supabase **Secret** 필드에 붙여넣습니다.
  3. 저장 후 앱에서 Apple 로그인을 다시 시도합니다.
- **참고**: 이렇게 하면 **웹**에서 Apple OAuth(리다이렉트)를 쓰는 경우는 동작하지 않을 수 있습니다. 웹에서도 Apple 로그인이 필요하면 Supabase/GoTrue에서 복수 Client ID를 지원하는지 확인하거나, 웹은 브라우저 리다이렉트만 쓰고 네이티브만 Bundle ID로 두는 방식으로 구분해 사용할 수 있습니다.

---

## 7. 참고

- **Supabase 공식**: [Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- **네이티브 OAuth 리다이렉트**: [NATIVE_OAUTH_REDIRECT.md](./NATIVE_OAUTH_REDIRECT.md)  
  → Apple도 동일하게 `torich://login-callback` + `exchangeCodeForSession` 사용 가능.
