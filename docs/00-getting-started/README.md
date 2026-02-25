# 00-getting-started

- Caminho: `docs/00-getting-started`
- Finalidade: documentação técnica e funcional organizada por domínio.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `COMMIT_CONVENTION.md`: Arquivo da camada local.
- `IA_GUIDE.md`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `COMMIT_CONVENTION.md`
- O que faz: documenta decisões e operação referentes a `docs/00-getting-started/COMMIT_CONVENTION.md`.
- Como: organiza instruções, contexto de arquitetura e referências de manutenção para o time.
- Por que: reduz custo de onboarding e evita conhecimento implícito disperso.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `IA_GUIDE.md`
- O que faz: documenta decisões e operação referentes a `docs/00-getting-started/IA_GUIDE.md`.
- Como: organiza instruções, contexto de arquitetura e referências de manutenção para o time.
- Por que: reduz custo de onboarding e evita conhecimento implícito disperso.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, HTTP interno/externo, Offline/sincronização, Serviços de IA, Runtime Elysia
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
