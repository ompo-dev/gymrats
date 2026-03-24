import { Redirect } from "expo-router";
import { NativeLoadingScreen } from "../src/components/native-loading-screen";
import { useAppStore } from "../src/store/app-store";

export default function IndexRoute() {
  const hydrated = useAppStore((state) => state.hydrated);
  const session = useAppStore((state) => state.session);

  if (!hydrated) {
    return <NativeLoadingScreen message="Iniciando app..." />;
  }

  if (
    session.token &&
    (session.user?.role === "STUDENT" || session.user?.role === "ADMIN")
  ) {
    return <Redirect href="/student" />;
  }

  if (session.token && session.user?.role === "PENDING") {
    return <Redirect href="/student/onboarding" />;
  }

  return <Redirect href="/web" />;
}
