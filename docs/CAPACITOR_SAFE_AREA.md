# Capacitor 앱에서 Safe Area(상태바/앱바) 처리

## 웹에서는 되는데 앱에서만 상태바와 겹치는 이유

### 1. 동작 차이

- **웹 브라우저**: `viewport-fit=cover` 메타가 있으면 `env(safe-area-inset-top)` 등이 기기별로 채워짐.
- **Capacitor 앱 (iOS WKWebView)**: 같은 HTML/CSS를 쓰지만, WebView가 **초기 로드 시점**에 viewport 메타를 제대로 반영하지 않거나, 네이티브가 safe area insets을 웹에 넘겨주지 않는 경우가 있음. 그럴 때 `env(safe-area-inset-top)` 이 **0px** 로 나와서, 상단 패딩이 거의 없어지고 앱바가 상태바와 겹쳐 보임.

### 2. 이 프로젝트에서 한 대응

1. **viewport를 Next.js 공식 방식으로 설정**  
   `app/layout.tsx` 에서 `viewport` export 로 `viewportFit: "cover"` 를 넣어서, 빌드된 HTML에 viewport 메타가 일관되게 포함되도록 함. (앱이 처음 로드할 때부터 적용되도록.)

2. **상단 최소 여백 44px**  
   앱바/메인 상단 패딩을 `max(env(safe-area-inset-top, 0px), 44px)` 로 두어서, **env()가 앱에서 0이어도** 상태바 높이(보통 44px 전후)만큼은 항상 띄우도록 함.  
   - 웹/노치 있는 기기: `env()` 값이 있으면 그걸 쓰고, 없거나 작으면 44px 사용.  
   - 앱에서 env()가 0인 경우: 44px만 사용해도 상태바와 겹치지 않음.

3. **앱바 높이 48px 고정**  
   로고/타이틀/알림이 들어가는 바 영역은 `h-12` + `min-h-[48px]` + `max-h-[48px]` 로 48px 고정.

### 3. 추가로 env()가 계속 0일 때

- iOS: `Info.plist` 등 네이티브 설정은 이미 일반적인 구성이라면, viewport + 44px fallback 으로 대부분 해결됨.
- Android: Chromium 구버전 WebView에서는 `env(safe-area-inset-*)` 가 0으로 나오는 이슈가 있어, [@capacitor-community/safe-area](https://github.com/capacitor-community/safe-area) 플러그인으로 패딩을 보정하는 방법이 있음.

이 문서는 “웹에서는 괜찮은데 앱에서만 상태바에 겹쳐 보일 때” 참고용이다.
