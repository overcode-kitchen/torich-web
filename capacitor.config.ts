import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.overcode.torich',
  appName: 'torich',
  webDir: 'out',
  server: {
    // 개발 시에만 주석 해제
    // url: 'http://localhost:3000', // 로컬 서버 연결
    // url: 'http://192.168.1.106:3000', // Mac IP
    // cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;