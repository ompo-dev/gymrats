// Função para forçar verificação imediata de lembretes (útil para testes)
export async function checkRemindersNow() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({ type: "CHECK_REMINDERS_NOW" });
    }
  } catch (error) {
    console.error("Erro ao verificar lembretes:", error);
  }
}
