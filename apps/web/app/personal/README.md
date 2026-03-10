# Módulo Personal

Estrutura alinhada a `app/gym` e `app/student`: layout, page como orquestrador por `tab`, e features em módulos privados.

## Árvore de rotas e módulos

- `/personal` — Rota principal. Conteúdo por query `?tab=...`.
- `/personal/onboarding` — Wizard de onboarding (sem shell de tabs).

## Segmentos (tabs) e módulos

| Tab         | Query           | Módulo (conteúdo)           | Descrição                    |
|------------|------------------|-----------------------------|------------------------------|
| Início     | `tab=dashboard` | `_dashboard/page-content`   | Resumo (academias, alunos)   |
| Alunos     | `tab=students`  | `_students/page-content`    | Lista e gestão de alunos     |
| Academias  | `tab=gyms`      | `_gyms/page-content`        | Academias vinculadas        |
| Finanças   | `tab=financial` | `_financial/page-content`  | Assinatura do personal       |
| Mais       | `tab=more`      | (menu)                      | Menu que leva a settings etc |
| Config.    | `tab=settings`  | `_settings/page-content`   | Perfil e modalidades         |

## Arquivos principais

- `layout.tsx` — Server shell com Suspense e fallback.
- `layout-content.tsx` — Client: AppLayout, tabs, controle de acesso (role PERSONAL).
- `page.tsx` — Entrada que renderiza `page-content`.
- `page-content.tsx` — Orquestrador: carrega dados (profile, affiliations, students, subscription) e renderiza o módulo correspondente ao `tab`.
- `types.ts` — Tipos compartilhados (PersonalProfile, PersonalAffiliation, etc.).

## Padrão de uso

O `page-content` faz o fetch único e repassa props para os módulos. Cada `_*/page-content.tsx` exporta um componente que recebe apenas os dados necessários (sem fetch próprio), permitindo depois trocar por organisms em `components/organisms/personal/` sem mudar a orquestração.
