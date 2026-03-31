import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { NativeAuthCallbackScreen } from "../../src/screens/auth/native-auth-callback-screen";
import { consumeOneTimeToken } from "../../src/lib/auth";
import { useAppStore } from "../../src/store/app-store";

export default function AuthCallbackRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    error?: string;
    oneTimeToken?: string;
    token?: string;
  }>();
  const config = useAppStore((state) => state.config);
  const upsertSession = useAppStore((state) => state.upsertSession);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      if (params.error) {
        setError("Erro ao autenticar com Google.");
        return;
      }

      const token = params.oneTimeToken || params.token;
      if (!token) {
        setError("O callback nao retornou token.");
        return;
      }

      try {
        const authResult = await consumeOneTimeToken(config.apiUrl, token);
        await upsertSession(authResult);
        router.replace("/web");
      } catch (callbackError) {
        setError(
          callbackError instanceof Error
            ? callbackError.message
            : "Nao foi possivel concluir o login.",
        );
      }
    };

    void run();
  }, [
    config.apiUrl,
    params.error,
    params.oneTimeToken,
    params.token,
    router,
    upsertSession,
  ]);

  return <NativeAuthCallbackScreen error={error} />;
}
