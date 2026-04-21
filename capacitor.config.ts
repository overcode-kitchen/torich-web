import type { CapacitorConfig } from '@capacitor/cli';

/** iOS 구글 로그인 딥링크 복귀용 URL 스킴 (문서/참고용, 실제 스킴은 Info.plist에 등록) */
const config: CapacitorConfig & { launchUrl?: string } = {
  appId: 'com.overcode.torich',
  appName: '토리치',
  webDir: 'out',
  launchUrl: 'torich://',
  /** 브리지 로그(To Native / TO JS) 억제: 'none' | 'debug'(개발 시만) | 'production' */
  loggingBehavior: 'debug',
  server: {
    // 개발 시에만 주석 해제
    // url: 'http://localhost:3000', // 로컬 서버 연결
    // url: 'http://172.29.80.191:3002', // Mac IP
    // cleartext: true
  },
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