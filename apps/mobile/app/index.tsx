import { NativeAppEntryScreen } from "../src/screens/entry/native-app-entry-screen";
import { useAppStore } from "../src/store/app-store";

export default function IndexRoute() {
  const hydrated = useAppStore((state) => state.hydrated);

  return <NativeAppEntryScreen hydrated={hydrated} />;
}
