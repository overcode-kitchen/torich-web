"use client";

import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { useFCMToken } from "@/app/hooks/notification/useFCMToken";
import { useAuth } from "@/app/hooks/auth/useAuth";
import { track } from "@/app/lib/analytics";

export default function NotificationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const { registerFCMToken } = useFCMToken();
    const userRef = useRef(user);
    userRef.current = user;

    /**
     * 리스너 등록을 시도했는지 (성공·실패 무관).
     * 권한 요청은 이 값이 정해진 뒤에 하되, 리스너 등록이 실패해도 막히지 않아야 하므로
     * `finally`에서 켠다. 리스너를 토큰보다 먼저 붙여 첫 푸시를 놓치지 않기 위한 순서다.
     */
    const [listenersReady, setListenersReady] = useState(false);

    /** 네이티브: 리스너만 1회 등록 (권한과 무관, user와도 무관) */
    useEffect(() => {
        let cancelled = false;

        const setupListeners = async () => {
            if (!Capacitor.isNativePlatform()) {
                return;
            }

            try {
                await PushNotifications.removeAllListeners();

                await PushNotifications.addListener(
                    "pushNotificationReceived",
                    (notification) => {
                        console.log(
                            "Push received: " + JSON.stringify(notification),
                        );
                    },
                );

                await PushNotifications.addListener(
                    "pushNotificationActionPerformed",
                    (notification) => {
                        console.log(
                            "Push action performed: " +
                                JSON.stringify(notification),
                        );
                    },
                );
            } catch (error) {
                console.error("❌ Push listener setup error:", error);
            } finally {
                if (!cancelled) setListenersReady(true);
            }
        };

        void setupListeners();

        return () => {
            cancelled = true;
            setListenersReady(false);
            if (Capacitor.isNativePlatform()) {
                void PushNotifications.removeAllListeners();
                void FirebaseMessaging.removeAllListeners();
            }
        };
    }, []);

    /**
     * 로그인 사용자 권한 요청 + FCM 등록.
     *
     * 권한 알럿은 온보딩·로그인을 마친 이 시점에 처음 뜬다. 앱 실행 직후에 물으면
     * 사용자가 앱을 알기도 전에 판단하게 되고, iOS 권한은 한 번 거부하면
     * 앱 안에서 되돌릴 수 없다.
     *
     * "이미 물어봤음"을 저장하지 않는 것은 의도다. 이미 결정된 상태에서는 iOS가
     * 알럿 없이 저장된 답을 즉시 돌려주므로 사용자에게 보이는 변화가 없고,
     * 거부했다가 나중에 iOS 설정에서 켠 사용자가 복구되는 유일한 경로이기 때문이다.
     */
    useEffect(() => {
        const uid = user?.id;
        if (!uid) return;

        const u = userRef.current;
        if (!u?.id) return;

        const isNative = Capacitor.isNativePlatform();
        if (isNative && !listenersReady) return;

        let cancelled = false;

        const requestAndRegister = async () => {
            if (isNative) {
                try {
                    track("notification_permission_prompt");
                    const permission =
                        await FirebaseMessaging.requestPermissions();
                    if (cancelled) return;
                    if (permission.receive !== "granted") {
                        track("notification_permission_denied");
                        console.warn("Push notification permission not granted");
                        return;
                    }
                    track("notification_permission_granted");
                } catch (error) {
                    console.error("❌ Push permission request error:", error);
                    return;
                }
            }

            if (cancelled) return;
            await registerFCMToken(u);
        };

        void requestAndRegister();

        return () => {
            cancelled = true;
        };
    }, [user?.id, listenersReady, registerFCMToken]);

    return <>{children}</>;
}
