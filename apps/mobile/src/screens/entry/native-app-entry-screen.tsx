import { Redirect } from "expo-router";
import { NativeLoadingScreen } from "../../components/native-loading-screen";

interface NativeAppEntryScreenProps {
  hydrated: boolean;
}

export function NativeAppEntryScreen({
  hydrated,
}: NativeAppEntryScreenProps) {
  if (!hydrated) {
    return <NativeLoadingScreen message="Iniciando app..." />;
  }

  return <Redirect href="/web" />;
}
