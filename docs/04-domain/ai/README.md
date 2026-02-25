# ai

- Caminho: `docs/04-domain/ai`
- Finalidade: documentação técnica e funcional organizada por domínio.

## Subpastas
- `agno/`: subdomínio de `docs/04-domain/ai/agno`.

## Arquivos
- `CHAT_IA_FLUXO_COMPLETO.md`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `CHAT_IA_FLUXO_COMPLETO.md`
- O que faz: documenta decisões e operação referentes a `docs/04-domain/ai/CHAT_IA_FLUXO_COMPLETO.md`.
- Como: organiza instruções, contexto de arquitetura e referências de manutenção para o time.
- Por que: reduz custo de onboarding e evita conhecimento implícito disperso.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, HTTP interno/externo, Offline/sincronização, Serviços de IA, Runtime Elysia
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
