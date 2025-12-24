"use client";

import { useEffect, useState, useRef } from "react";

export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isReloadingRef = useRef(false);
  const hasCheckedInitialRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;
    let updateInterval: NodeJS.Timeout | null = null;
    let visibilityHandler: (() => void) | null = null;
    let messageHandler: ((event: MessageEvent) => void) | null = null;

    // Verifica se o arquivo do Service Worker está acessível antes de registrar
    const registerSW = async () => {
      try {
        // Primeiro, verifica se o arquivo existe
        const response = await fetch("/sw.js", { method: "HEAD" });
        if (!response.ok) {
          console.warn("⚠️ Service Worker não encontrado, pulando registro");
          return;
        }

        // Registra o service worker
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        registration = reg;

        // Detecta quando um novo worker está sendo instalado (atualização automática)
        const checkForWaitingWorker = () => {
          // Em desenvolvimento, não atualiza automaticamente
          if (process.env.NODE_ENV === "development") {
            return;
          }

          if (reg.waiting && !isReloadingRef.current) {
            // Worker esperando para ativar - mostra tela de atualização
            console.log(
              "🔄 Nova versão detectada, atualizando automaticamente..."
            );
            isReloadingRef.current = true;
            setIsUpdating(true);
            // Envia mensagem para pular espera e ativar
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
            // Recarrega após um breve delay
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        };

        // Verifica imediatamente se há um worker esperando (atualização pendente)
        // Mas apenas uma vez ao carregar a página
        if (!hasCheckedInitialRef.current) {
          hasCheckedInitialRef.current = true;
          // Delay para evitar verificação imediata em desenvolvimento
          setTimeout(() => {
            checkForWaitingWorker();
          }, 1000);
        }

        // Listener para detectar atualizações
        const updateFoundHandler = () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          const stateChangeHandler = () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // Há um controller ativo, então esta é uma atualização
                // Em produção, atualiza automaticamente
                if (process.env.NODE_ENV === "production") {
                  checkForWaitingWorker();
                } else {
                  // Em desenvolvimento, apenas notifica
                  console.log("🔄 Nova versão disponível!");
                  setUpdateAvailable(true);
                }
              } else {
                // Primeira instalação
                console.log("✅ Service Worker instalado pela primeira vez");
              }
            }
          };

          newWorker.addEventListener("statechange", stateChangeHandler);

          // Captura erros durante a instalação
          const errorHandler = (errorEvent: ErrorEvent) => {
            console.error(
              "❌ Erro durante instalação do Service Worker:",
              errorEvent
            );
          };
          newWorker.addEventListener("error", errorHandler);
        };

        reg.addEventListener("updatefound", updateFoundHandler);

        // Verifica atualizações a cada 60 segundos (apenas em produção)
        if (process.env.NODE_ENV === "production") {
          updateInterval = setInterval(() => {
            if (!isReloadingRef.current) {
              reg.update();
            }
          }, 60000);
        }

        // Verifica atualizações quando a página recebe foco (apenas em produção)
        if (process.env.NODE_ENV === "production") {
          visibilityHandler = () => {
            if (!document.hidden && !isReloadingRef.current) {
              reg.update();
            }
          };
          document.addEventListener("visibilitychange", visibilityHandler);
        }

        // Listener para mensagens do service worker
        messageHandler = (event: MessageEvent) => {
          if (event.data && event.data.type === "SW_UPDATED") {
            console.log("✅ Service Worker atualizado:", event.data.version);
            
            // Em desenvolvimento, apenas loga e não recarrega
            if (process.env.NODE_ENV === "development") {
              console.log("ℹ️ Em desenvolvimento: atualização detectada mas não aplicada automaticamente");
              return;
            }

            // Evita múltiplos reloads
            if (isReloadingRef.current) {
              return;
            }

            // Mostra tela de atualização antes de recarregar
            isReloadingRef.current = true;
            setIsUpdating(true);
            // Recarrega a página para aplicar a nova versão após um breve delay
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        };
        navigator.serviceWorker.addEventListener("message", messageHandler);

        console.log("✅ Service Worker registrado com sucesso");
      } catch (error) {
        console.error("❌ Erro ao registrar Service Worker:", {
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined,
        });
      }
    };

    // Aguarda o carregamento completo da página antes de registrar
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
    }

    // Cleanup
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (visibilityHandler) {
        document.removeEventListener("visibilitychange", visibilityHandler);
      }
      if (messageHandler) {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
      }
    };
  }, []);

  const applyUpdate = async () => {
    if (
      !("serviceWorker" in navigator) ||
      !navigator.serviceWorker.controller ||
      isReloadingRef.current
    ) {
      return;
    }

    isReloadingRef.current = true;
    setIsUpdating(true);

    try {
      // Envia mensagem para o service worker pular a espera
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      // Força recarregamento da página após um breve delay
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("❌ Erro ao aplicar atualização:", error);
      isReloadingRef.current = false;
      setIsUpdating(false);
    }
  };

  return {
    updateAvailable,
    isUpdating,
    applyUpdate,
  };
}

