// Função para buscar dados do app e enviar para SW
export async function syncAppDataToServiceWorker(appData: any) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) return;
    
    registration.active.postMessage({
      type: "UPDATE_APP_DATA",
      data: appData
    });
  } catch (error) {
    console.error("Erro ao sincronizar dados com SW:", error);
  }
}

// Função para forçar verificação imediata (útil para testes)
export async function checkRemindersNow() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({
        type: "CHECK_REMINDERS_NOW"
      });
    }
  } catch (error) {
    console.error("Erro ao verificar lembretes:", error);
  }
}

