# learn

- Caminho: `app/student/learn`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `learning-path.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `learning-path.tsx`
- O que faz: implementa o módulo `learning-path.tsx` da camada `learn`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `next/navigation`, `nuqs`, `react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/section-card`, `@/components/organisms/modals/create-unit-modal`, `@/components/organisms/modals/edit-unit-modal`, `@/components/organisms/workout/workout-node`, `@/components/ui/unit-section-card`, `@/hooks/use-load-prioritized`
- Expõe: `LearningPath`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/page-content.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
