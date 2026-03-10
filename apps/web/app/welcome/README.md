# welcome

- Caminho: `app/welcome`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `page.tsx`: Entrypoint de página.

## Detalhamento técnico por arquivo

### `page.tsx`
- O que faz: implementa a página de entrada da rota `app/welcome/page.tsx`.
- Como: compõe componentes e hooks para executar o fluxo principal da tela; operações detectadas: `WelcomePageContent`, `useRouter`, `useSearchParams`, `useAuthStore`, `useStudentUnifiedStore`.
- Por que: mantém o entrypoint de navegação explícito e alinhado ao filesystem routing.
- Importa principalmente: `lucide-react`, `motion/react`, `next/image`, `next/navigation`, `react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/lib/api/auth`, `@/lib/auth-client`, `@/lib/utils/pwa-detection`, `@/stores`, `@/stores/student-unified-store`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
