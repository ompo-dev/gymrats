/**
 * Utilitários para formatação monetária no padrão brasileiro R$ 0.000,00
 */

/** Formata número para exibição: R$ 1.234,56 */
export function formatCurrencyBR(
  value: number | undefined | null,
): string {
  if (value == null || Number.isNaN(value)) return "R$ 0,00";
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Converte string formatada (R$ 1.234,56 ou 1234,56) para número.
 * Extrai apenas dígitos e considera os 2 últimos como centavos.
 */
export function parseCurrencyBR(str: string): number {
  if (!str || typeof str !== "string") return 0;
  const digits = str.replace(/\D/g, "");
  if (digits.length === 0) return 0;
  return parseInt(digits, 10) / 100;
}

/**
 * Formata valor para input de moeda (somente dígitos -> R$ 0.000,00).
 * Útil para máscara de input.
 */
export function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  const value = parseInt(digits, 10) / 100;
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
