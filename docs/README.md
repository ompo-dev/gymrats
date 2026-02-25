# Documentacao GymRats

Este indice organiza a documentacao por dominio e estado de manutencao.
Os arquivos originais foram mantidos nos caminhos atuais para evitar quebra
de links durante a migracao moderada.

## Taxonomia alvo

- `00-getting-started`: entrada rapida, guias e convencoes.
- `01-architecture`: arquitetura, analises e decisoes estruturais.
- `02-frontend`: UI, componentes e estado no cliente.
- `03-backend`: API, rotas e documentacao tecnica de backend.
- `04-domain`: documentos por dominio de negocio (students, pagamentos, IA).
- `05-devops`: ambiente, docker, seed, seguranca operacional.
- `06-releases`: checklists e governanca de release.

## Estado dos documentos atuais

- `ATIVO`: deve ser mantido e revisado continuamente.
- `REVISAO`: valido, mas com pontos defasados.
- `HISTORICO`: referencia de contexto; nao deve guiar implementacao nova.

## Mapa rapido (arquivo atual -> secao alvo -> status)

- `docs/00-getting-started/IA_GUIDE.md` -> `00-getting-started` -> `REVISAO`
- `docs/00-getting-started/COMMIT_CONVENTION.md` -> `00-getting-started` -> `ATIVO`

- `docs/01-architecture/ARQUITETURA_COMPLETA_SISTEMA.md` -> `01-architecture` -> `REVISAO`
- `docs/01-architecture/ANALISE_COMPLETA_PROJETO.md` -> `01-architecture` -> `REVISAO`
- `docs/01-architecture/plan.md` -> `01-architecture` -> `HISTORICO`

- `docs/02-frontend/UI_UX_SYSTEM_DESIGN.md` -> `02-frontend` -> `ATIVO`
- `docs/02-frontend/components/ATOMIC_DESIGN_COMPLETO.md` -> `02-frontend` -> `ATIVO`
- `docs/02-frontend/state/HOOKS_STORE_COMPLETO.md` -> `02-frontend` -> `REVISAO`
- `docs/02-frontend/navigation/NUQS_MODAIS_COMPLETO.md` -> `02-frontend` -> `ATIVO`

- `docs/03-backend/api/API_COMPLETA.md` -> `03-backend` -> `REVISAO`
- `docs/03-backend/references/llms-full.txt` -> `03-backend` -> `HISTORICO`

- `docs/04-domain/students/DADOS_STUDENT_COMPLETO.md` -> `04-domain/students` -> `REVISAO`
- `docs/04-domain/payments/FLUXO_PAGAMENTOS_COMPLETO.md` -> `04-domain/payments` -> `ATIVO`
- `docs/04-domain/ai/CHAT_IA_FLUXO_COMPLETO.md` -> `04-domain/ai` -> `ATIVO`
- `docs/04-domain/ai/agno/ESTUDO_LLMS_FULL.md` -> `04-domain/ai` -> `HISTORICO`
- `docs/04-domain/ai/agno/PLANO_IMPLEMENTACAO_CHAT_IA.md` -> `04-domain/ai` -> `HISTORICO`

- `docs/05-devops/DOCKER.md` -> `05-devops` -> `ATIVO`
- `docs/05-devops/SEED_DATABASE.md` -> `05-devops` -> `REVISAO`
- `docs/05-devops/SEGURANCA_LOCALSTORAGE.md` -> `05-devops` -> `ATIVO`

- `docs/06-releases/STUDENT_RELEASE_CHECKLIST.md` -> `06-releases` -> `REVISAO`

## Proximo passo recomendado

Usar os indices de cada secao para navegar no conteudo consolidado e priorizar
atualizacoes com severidade P0/P1 primeiro.
