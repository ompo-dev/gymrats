import { Redirect } from "expo-router";
import { NativeLoadingScreen } from "../src/components/native-loading-screen";
import { useAppStore } from "../src/store/app-store";

export default function IndexRoute() {
  const hydrated = useAppStore((state) => state.hydrated);

  if (!hydrated) {
    return <NativeLoadingScreen message="Iniciando app..." />;
  }

  // O usuário solicitou que o Webview seja o padrão. Removemos os desvios para telas nativas.
  return <Redirect href="/web" />;
}
