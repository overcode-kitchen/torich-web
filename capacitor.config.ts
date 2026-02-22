import type { CapacitorConfig } from '@capacitor/cli';

/** iOS 구글 로그인 딥링크 복귀용 URL 스킴 (문서/참고용, 실제 스킴은 Info.plist에 등록) */
const config: CapacitorConfig & { launchUrl?: string } = {
  appId: 'com.overcode.torich',
  appName: 'torich',
  webDir: 'out',
  launchUrl: 'torich://',
  server: {
    // 개발 시에만 주석 해제
    // url: 'http://localhost:3000', // 로컬 서버 연결
    url: 'http://192.168.1.103:3000', // Mac IP
    // cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    App: {},
  },
};

export default config;