/**
 * Utilitários para detectar se o app está rodando como PWA
 */

/**
 * Detecta se o app está rodando em modo standalone (PWA instalado)
 * @returns true se estiver em modo standalone/PWA
 */
export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // iOS Safari
  if (
    (window.navigator as any).standalone === true ||
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.matchMedia("(display-mode: fullscreen)").matches) ||
      (window.matchMedia("(display-mode: minimal-ui)").matches))
  ) {
    return true;
  }

  // Android Chrome
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }

  // Verificar se está em modo standalone via user agent e window features
  // Alguns navegadores não suportam matchMedia, então usar heurística
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://");

  return isStandalone;
}

/**
 * Detecta se o app está rodando em um navegador móvel
 * @returns true se estiver em dispositivo móvel
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  );
}

/**
 * Detecta se o app está rodando em iOS
 * @returns true se estiver em iOS
 */
export function isIOS(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

/**
 * Detecta se o app está rodando em Android
 * @returns true se estiver em Android
 */
export function isAndroid(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return /Android/.test(window.navigator.userAgent);
}
