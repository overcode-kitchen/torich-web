"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { createClient } from "@/utils/supabase/client";
import { useFCMToken } from "@/app/hooks/notification/useFCMToken";
import { useAuth } from "@/app/hooks/auth/useAuth";

export default function NotificationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const { registerFCMToken } = useFCMToken();

    useEffect(() => {
        const initPushNotifications = async () => {
            try {
                // 1. 네이티브 플랫폼 확인
                if (!Capacitor.isNativePlatform()) {
                    console.log("Not a native platform. Skipping push notification setup.");
                    return;
                }

                // 2. 권한 요청 (FirebaseMessaging 플러그인 사용)
                const permission = await FirebaseMessaging.requestPermissions();
                if (permission.receive !== "granted") {
                    console.warn("Push notification permission not granted");
                    return;
                }

                // 3. FCM 토큰 등록 (useFCMToken 훅 사용)
                if (user) {
                    await registerFCMToken(user);
                }
            } catch (error) {
                console.error("❌ Push notification setup error:", error);
            }

            // 리스너 등록: 포그라운드 알림 수신 (유지 - PushNotifications 플러그인 사용)
            // FirebaseMessaging 플러그인에도 리스너가 있지만, 기존 코드 유지를 위해 PushNotifications 사용
            // 만약 중복 수신 문제가 발생하면 FirebaseMessaging.addListener로 교체 고려
            await PushNotifications.addListener(
                "pushNotificationReceived",
                (notification) => {
                    console.log("Push received: " + JSON.stringify(notification));
                }
            );

            // 리스너 등록: 알림 탭 액션 (유지)
            await PushNotifications.addListener(
                "pushNotificationActionPerformed",
                (notification) => {
                    console.log(
                        "Push action performed: " + JSON.stringify(notification)
                    );
                }
            );
        };

        initPushNotifications();

        // 정리(cleanup)
        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
                FirebaseMessaging.removeAllListeners();
            }
        };
    }, [user, registerFCMToken]);

    return <>{children}</>;
}
