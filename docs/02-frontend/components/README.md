# components

- Caminho: `docs/02-frontend/components`
- Finalidade: documentação técnica e funcional organizada por domínio.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `ATOMIC_DESIGN_COMPLETO.md`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `ATOMIC_DESIGN_COMPLETO.md`
- O que faz: documenta decisões e operação referentes a `docs/02-frontend/components/ATOMIC_DESIGN_COMPLETO.md`.
- Como: organiza instruções, contexto de arquitetura e referências de manutenção para o time.
- Por que: reduz custo de onboarding e evita conhecimento implícito disperso.
- Importa principalmente: `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/progress`, `@/components/atoms/buttons/button`, `@/components/atoms/inputs/input`, `@/components/atoms/progress/progress`, `@/components/ui/duo-card`, `@/components/ui/section-card`, `@/components/ui/step-card`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/components/molecules/cards/step-card`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
