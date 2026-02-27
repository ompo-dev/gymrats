# hooks

- Caminho: `lib/hooks`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- Nenhum. O hook `usePWAUpdate` foi movido para `hooks/use-pwa-update.ts` (raiz do projeto).

## Detalhamento
- `usePWAUpdate`: ver `hooks/use-pwa-update.ts`. Usado em `components/organisms/pwa/app-updating-screen-wrapper.tsx`, `pwa-update-banner.tsx`.

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
