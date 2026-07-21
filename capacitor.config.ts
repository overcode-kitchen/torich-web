import type { CapacitorConfig } from '@capacitor/cli';

/**
 * 실기기 라이브 리로드용 개발 서버 주소. `npm run sync:app`이 맥의 LAN IP로 채워준다.
 *
 * 이 값을 파일에 직접 적지 않고 환경변수로 받는 이유: 주석 해제된 server.url이 그대로 커밋·배포되면
 * 운영 앱이 개발자 맥을 바라보게 되어 전체 사용자가 앱을 못 쓴다. 환경변수로 두면 커밋될 파일에는
 * 개발 주소가 존재할 수 없고, 릴리즈 빌드는 변수를 설정하지 않으므로 항상 안전한 기본값이 된다.
 */
const devServerUrl = process.env.CAP_SERVER_URL;

/** iOS 구글 로그인 딥링크 복귀용 URL 스킴 (문서/참고용, 실제 스킴은 Info.plist에 등록) */
const config: CapacitorConfig & { launchUrl?: string } = {
  appId: 'com.overcode.torich',
  appName: '토리치',
  webDir: 'out',
  launchUrl: 'torich://',
  /** 브리지 로그(To Native / TO JS) 억제: 'none' | 'debug'(개발 시만) | 'production' */
  loggingBehavior: devServerUrl ? 'debug' : 'production',
  // cleartext: 개발 서버가 http라서 필요. 릴리즈 빌드에는 server 자체가 빈 객체로 남는다.
  server: devServerUrl ? { url: devServerUrl, cleartext: true } : {},
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    App: {},
    SplashScreen: {
      launchShowDuration: 1500,  // 최소 1.5초 보장
      launchAutoHide: true,      // 웹뷰 준비되면 자동 숨김 (1.5초 이후)
      backgroundColor: '#EEECE6',
      showSpinner: false,
    },
  },
};

export default config;