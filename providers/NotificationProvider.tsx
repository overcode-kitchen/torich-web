"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { createClient } from "@/utils/supabase/client";

export default function NotificationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        const initPushNotifications = async () => {
            try {
                // 1. 네이티브 플랫폼 확인 (웹이면 중단)
                if (!Capacitor.isNativePlatform()) {
                    console.log("Not a native platform. Skipping push notification setup.");
                    return;
                }

                const supabase = createClient();

                // 2. 권한 요청 (FirebaseMessaging 플러그인 사용)
                // requestPermissions()는 알림 권한을 요청합니다.
                const permission = await FirebaseMessaging.requestPermissions();
                if (permission.receive !== "granted") {
                    console.warn("Push notification permission not granted");
                    return;
                }

                // 3. FCM 토큰 가져오기 (네이티브 플러그인 사용)
                // @capacitor-firebase/messaging 플러그인은 내부적으로 APNs 등록 및 FCM 토큰 매핑을 처리합니다.
                // 따라서 별도의 PushNotifications.register() 호출이 필요하지 않을 수 있으나,
                // 플러그인 문서에 따라 명시적으로 호출하는 것이 안전할 수 있습니다.
                // 여기서는 getToken()이 내부적으로 필요한 등록 절차를 수행한다고 가정합니다.
                const { token: fcmToken } = await FirebaseMessaging.getToken();

                if (!fcmToken) {
                    console.error("FCM token is undefined");
                    return;
                }

                console.log("✅ FCM Token received:", fcmToken);

                // 4. 로그인 확인
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    console.log("No user logged in. Skipping token save.");
                    return;
                }

                // 5. 전역 알림 설정 확인
                const { data: settings } = await supabase
                    .from("user_settings")
                    .select("notification_global_enabled")
                    .eq("user_id", user.id)
                    .single();

                if (settings && !settings.notification_global_enabled) {
                    console.log("Global notifications disabled. Skipping token save.");
                    return;
                }

                // 6. device_id 생성
                // 6. device_id 생성
                const uuidv4 = () => {
                    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                        const r = (Math.random() * 16) | 0,
                            v = c === "x" ? r : (r & 0x3) | 0x8;
                        return v.toString(16);
                    });
                };
                const deviceId = Capacitor.getPlatform() + "-" + uuidv4();

                // 7. Supabase에 토큰 저장 (Upsert)
                const { error } = await supabase.from("user_push_tokens").upsert(
                    {
                        user_id: user.id,
                        token: fcmToken,
                        platform: "ios",
                        device_id: deviceId,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id, device_id" }
                );

                if (error) {
                    console.error("Failed to save token:", error);
                } else {
                    console.log("✅ Token saved to DB");
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
    }, []);

    return <>{children}</>;
}
