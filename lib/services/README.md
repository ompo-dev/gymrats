# services

- Caminho: `lib/services`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- `gym/`: subdomínio de `lib/services/gym`.
- `student/`: subdomínio de `lib/services/student`.

## Arquivos
- `email.service.ts`: Arquivo da camada local.
- `gym-domain.service.ts`: Arquivo da camada local.
- `personalized-workout-generator.ts`: Arquivo da camada local.
- `populate-workout-exercises-educational-data.ts`: Arquivo da camada local.
- `student-domain.service.ts`: Arquivo da camada local.
- `upload-foods-from-csv.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `email.service.ts`
- O que faz: implementa o módulo `email.service.ts` da camada `services`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `nodemailer`
- Expõe: `sendWelcomeEmail`, `sendResetPasswordEmail`
- Comunica com: Autenticação/sessão
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `gym-domain.service.ts`
- O que faz: implementa o módulo `gym-domain.service.ts` da camada `services`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `personalized-workout-generator.ts`
- O que faz: implementa o módulo `personalized-workout-generator.ts` da camada `services`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`, `@/lib/educational-data`, `@/lib/types`
- Expõe: `calculateSets`, `calculateReps`, `calculateRest`, `generateAlternatives`, `generatePersonalizedWorkoutPlan`, `updateExercisesWithAlternatives`, `hasPersonalizedWorkouts`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: `app/api/workouts/generate/route.ts`, `app/api/workouts/process/route.ts`, `lib/api/handlers/workout-management.handler.ts`, `server/handlers/workout-management.ts`, `server/handlers/workouts-ai.ts`

### `populate-workout-exercises-educational-data.ts`
- O que faz: implementa o módulo `populate-workout-exercises-educational-data.ts` da camada `services`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`, `@/lib/educational-data`
- Expõe: `populateWorkoutExercisesWithEducationalData`, `populateSingleWorkoutExercise`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: `app/api/workouts/populate-educational-data/route.ts`, `server/handlers/workouts-ai.ts`

### `student-domain.service.ts`
- O que faz: implementa o módulo `student-domain.service.ts` da camada `services`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`, `@/lib/types`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `upload-foods-from-csv.ts`
- O que faz: implementa o módulo `upload-foods-from-csv.ts` da camada `services`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `node:fs`, `csv-parse/sync`, `@/lib/db`
- Expõe: `parseFoodsFromCSV`, `uploadFoodsFromCSV`, `uploadFoodsFromCSVContent`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: `app/api/foods/upload/route.ts`, `server/handlers/foods.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
