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

    const [pushReady, setPushReady] = useState(false);

    /** 네이티브: 권한 + 리스너만 1회 (user와 무관) */
    useEffect(() => {
        let cancelled = false;

        const setupListeners = async () => {
            if (!Capacitor.isNativePlatform()) {
                return;
            }

            try {
                track("notification_permission_prompt");
                const permission = await FirebaseMessaging.requestPermissions();
                if (cancelled) return;
                if (permission.receive !== "granted") {
                    track("notification_permission_denied");
                    console.warn("Push notification permission not granted");
                    return;
                }
                track("notification_permission_granted");

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

                if (!cancelled) setPushReady(true);
            } catch (error) {
                console.error("❌ Push listener setup error:", error);
            }
        };

        void setupListeners();

        return () => {
            cancelled = true;
            setPushReady(false);
            if (Capacitor.isNativePlatform()) {
                void PushNotifications.removeAllListeners();
                void FirebaseMessaging.removeAllListeners();
            }
        };
    }, []);

    /** 로그인 사용자 FCM 등록 (user.id 기준, 네이티브는 push 준비 후) */
    useEffect(() => {
        const uid = user?.id;
        if (!uid) return;

        const u = userRef.current;
        if (!u?.id) return;

        if (Capacitor.isNativePlatform() && !pushReady) return;

        void registerFCMToken(u);
    }, [user?.id, pushReady, registerFCMToken]);

    return <>{children}</>;
}
