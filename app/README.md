# app

- Caminho: `app`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- `api/`: subdomínio de `app/api`.
- `api-docs/`: subdomínio de `app/api-docs`.
- `auth/`: subdomínio de `app/auth`.
- `gym/`: subdomínio de `app/gym`.
- `student/`: subdomínio de `app/student`.
- `swagger/`: subdomínio de `app/swagger`.
- `welcome/`: subdomínio de `app/welcome`.

## Arquivos
- `globals.css`: Estilos da camada visual.
- `layout.tsx`: Layout compartilhado de rota.
- `not-found.tsx`: Arquivo da camada local.
- `page.tsx`: Entrypoint de página.
- `pwa-protection.tsx`: Arquivo da camada local.
- `pwa-register.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `globals.css`
- O que faz: define estilos globais/segmentados em `app/globals.css`.
- Como: declara regras CSS com tokens/variáveis para padronizar aparência e comportamento visual.
- Por que: centraliza consistência visual e reduz divergência de estilo entre telas/componentes.
- Importa principalmente: `tailwindcss`, `tw-animate-css`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `layout.tsx`
- O que faz: define o layout compartilhado do segmento `app`.
- Como: encapsula providers, chrome de navegação e elementos persistentes entre páginas filhas; sinais: `DM_Sans`, `Space_Grotesk`, `RootLayout`.
- Por que: elimina duplicação estrutural e mantém consistência transversal de UX.
- Importa principalmente: `@vercel/analytics/next`, `next`, `next/font/google`, `nuqs/adapters/next/app`, `react`, `react`, `@/components/organisms/error-boundary`, `@/components/organisms/performance-optimizer`, `@/components/organisms/pwa/app-updating-screen-wrapper`, `@/components/organisms/pwa/pwa-update-banner`, `@/components/providers/query-provider`, `./pwa-protection`
- Expõe: `metadata`, `viewport`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `not-found.tsx`
- O que faz: renderiza a experiência 404 do App Router para rotas não resolvidas.
- Como: monta uma tela de fallback com CTA de navegação e feedback visual, sem depender da lógica de domínio da página original.
- Por que: garante degradação graciosa quando a rota é inválida e evita tela em branco para o usuário.
- Importa principalmente: `lucide-react`, `motion/react`, `next/navigation`, `react`, `@/lib/utils`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `page.tsx`
- O que faz: implementa a página de entrada da rota `app/page.tsx`.
- Como: compõe componentes e hooks para executar o fluxo principal da tela; operações detectadas: `Home`, `useRouter`, `useState`, `useEffect`, `setMounted`.
- Por que: mantém o entrypoint de navegação explícito e alinhado ao filesystem routing.
- Importa principalmente: `next/navigation`, `react`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `pwa-protection.tsx`
- O que faz: implementa o módulo `pwa-protection.tsx` da camada `app`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `react`
- Expõe: `PWAProtection`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/layout.tsx`

### `pwa-register.tsx`
- O que faz: implementa o módulo `pwa-register.tsx` da camada `app`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `react`, `@/lib/constants/version`
- Expõe: `PWARegister`
- Comunica com: Offline/sincronização
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
