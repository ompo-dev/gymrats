# Relatorio de Auditoria de Documentacao

Data: 2026-02-25
Escopo: `docs` + aderencia com codebase autoral (sem artefatos gerados)

## Resumo executivo

- A documentacao foi organizada por taxonomia moderada com indice mestre.
- Pontos P0 de onboarding/API foram corrigidos.
- Foram encontrados gaps remanescentes P1/P2 em documentos historicos e IA/pagamentos.

## O que foi reorganizado

- Criado indice principal: `docs/README.md`.
- Criadas secoes:
  - `docs/00-getting-started/README.md`
  - `docs/01-architecture/README.md`
  - `docs/02-frontend/README.md`
  - `docs/03-backend/README.md`
  - `docs/04-domain/README.md`
  - `docs/05-devops/README.md`
  - `docs/06-releases/README.md`
- Estrategia aplicada: reorganizacao logica com compatibilidade de links (sem ruptura de caminhos antigos).

## Correcao de inconsistencias aplicadas

### P0 (critico)

1. API desatualizada para arquitetura real:
   - Atualizado `docs/03-backend/api/API_COMPLETA.md` para refletir `server/app.ts` + `server/routes/*.ts`.

2. Caminhos de migration incorretos:
   - Corrigido `docs/05-devops/SEED_DATABASE.md`.
   - Corrigido `docs/04-domain/students/DADOS_STUDENT_COMPLETO.md`.
   - Padrao corrigido para `scripts/migration/*.js`.

3. Onboarding quebrado por `.env.example` inexistente:
   - Ajustado `README.md` para criacao manual de `.env`.

### P1 (importante)

4. Referencias quebradas no guia de IA:
   - Removido `docs/api-refactor-plan.md` (inexistente) em `docs/00-getting-started/IA_GUIDE.md`.
   - Removidas referencias para `CARREGAMENTO_PRIORITIZADO.md` inexistente.
   - Atualizado mapa de backend para `server/routes/**`, `server/handlers/**`, `server/plugins/**`.

5. Arquitetura com link inexistente:
   - Ajustado `docs/01-architecture/ARQUITETURA_COMPLETA_SISTEMA.md` para remover link quebrado e atualizar camada de API para Elysia.

6. Documento de migracao marcado como historico:
   - `docs/01-architecture/plan.md` recebeu cabecalho de status historico.

## Matriz docs vs codebase (estado apos correcao)

| Area | Estado | Evidencia |
|---|---|---|
| Rotas base `/api/*` | Alinhado | `server/app.ts` |
| API por dominio | Alinhado no doc principal | `docs/03-backend/api/API_COMPLETA.md` vs `server/routes/*.ts` |
| Scripts de migration | Alinhado | `docs/05-devops/SEED_DATABASE.md` e `docs/04-domain/students/DADOS_STUDENT_COMPLETO.md` |
| Setup de ambiente | Alinhado | `README.md` sem `.env.example` |
| Guia IA (navegacao) | Parcialmente alinhado | `docs/00-getting-started/IA_GUIDE.md` atualizado |
| Docs historicos de migração/estudo | Mantidos como historico | `docs/01-architecture/plan.md`, `docs/agno/*`, `docs/03-backend/references/llms-full.txt` |

## Gaps remanescentes

### P1

- `docs/01-architecture/ANALISE_COMPLETA_PROJETO.md` ainda menciona item de roadmap de pagamentos como Stripe, enquanto implementacao atual usa AbacatePay.
- `docs/04-domain/payments/FLUXO_PAGAMENTOS_COMPLETO.md` ainda referencia caminhos `app/api/...` (valido em modo legado/custom, mas precisa explicitar melhor qual runtime e qual fonte primaria atual no `server/routes`).
- `docs/01-architecture/ARQUITETURA_COMPLETA_SISTEMA.md` ainda possui trechos extensos com exemplos antigos de `app/api` em secoes de referencia.

### P2

- Linguagem assertiva de "100% completo/pronto para producao" em varios docs sem checklist operacional formal anexo.
- `docs/03-backend/references/llms-full.txt` e `docs/agno/*` seguem como acervo tecnico/historico e podem confundir onboarding se nao forem claramente rotulados no indice.

## Backlog recomendado de manutencao continua

1. Criar politica de status por documento (`ATIVO`, `REVISAO`, `HISTORICO`) no cabecalho de cada arquivo principal.
2. Definir rotina de revisao de docs por release (incluir no checklist de `docs/06-releases`).
3. Consolidar docs de pagamentos para explicitar:
   - fonte primaria de endpoints atuais,
   - caminho de webhook por ambiente,
   - fluxo de fallback.
4. Revisar e podar exemplos legados em `docs/01-architecture/ARQUITETURA_COMPLETA_SISTEMA.md` e `docs/01-architecture/ANALISE_COMPLETA_PROJETO.md`.
5. Criar pagina curta de "Fonte de verdade atual" com ponteiros para:
   - `server/app.ts`
   - `server/routes/*.ts`
   - `server/handlers/*.ts`
   - `docs/03-backend/api/API_COMPLETA.md`

## Conclusao

A base documental ficou organizada e navegavel, com correcao dos pontos criticos que bloqueavam onboarding e manutencao. O restante do trabalho esta concentrado em higiene de documentos historicos e reducao de ambiguidade entre caminho legado e runtime atual.
