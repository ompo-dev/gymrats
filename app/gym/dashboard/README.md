# dashboard

- Caminho: `app/gym/dashboard`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `page-content.tsx`: Arquivo da camada local.
- `page.tsx`: Entrypoint de página.

## Detalhamento técnico por arquivo

### `page-content.tsx`
- O que faz: implementa o módulo `page-content.tsx` da camada `dashboard`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `next/image`, `@/components/molecules/relative-time`, `@/components/ui/card`, `@/lib/types`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/dashboard/page.tsx`

### `page.tsx`
- O que faz: implementa a página de entrada da rota `app/gym/dashboard/page.tsx`.
- Como: compõe componentes e hooks para executar o fluxo principal da tela; operações detectadas: `DashboardPage`, `all`, `getGymProfile`, `getGymStats`, `getGymStudents`.
- Por que: mantém o entrypoint de navegação explícito e alinhado ao filesystem routing.
- Importa principalmente: `../actions`, `./page-content`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
