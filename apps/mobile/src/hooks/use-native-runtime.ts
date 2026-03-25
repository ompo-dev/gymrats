import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { getNativeCapabilities } from "../lib/device-capabilities";
import {
  extractRouteFromNotificationData,
  installNotificationHandler,
  reconcilePushNotifications,
} from "../lib/push";
import { useAppStore } from "../store/app-store";

export function useNativeRuntime() {
  const config = useAppStore((state) => state.config);
  const sessionToken = useAppStore((state) => state.session.token);
  const lastHandledNotificationIdRef = useRef<string | null>(null);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      if (!response) {
        return;
      }

      const notificationId = response.notification.request.identifier;
      if (lastHandledNotificationIdRef.current === notificationId) {
        return;
      }

      const route = extractRouteFromNotificationData(
        response.notification.request.content.data,
      );
      if (!route) {
        return;
      }

      lastHandledNotificationIdRef.current = notificationId;
      router.replace({
        pathname: "/web",
        params: {
          path: route,
        },
      });
    },
    [],
  );

  useEffect(() => {
    installNotificationHandler();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    void Notifications.getLastNotificationResponseAsync().then(
      handleNotificationResponse,
    );

    return () => {
      subscription.remove();
    };
  }, [handleNotificationResponse]);

  useEffect(() => {
    void reconcilePushNotifications({
      apiUrl: config.apiUrl,
      sessionToken,
      capabilities: getNativeCapabilities(),
    });
  }, [config.apiUrl, sessionToken]);
}
