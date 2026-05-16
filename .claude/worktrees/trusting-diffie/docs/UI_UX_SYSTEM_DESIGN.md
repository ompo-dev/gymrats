## Sistema de Design UI/UX – Gymrats

Este documento descreve o sistema de design da aplicação Gymrats com foco em coerência visual, previsibilidade de interação e escalabilidade da interface. Ele é baseado principalmente nos componentes existentes:

- `Button` (`components/atoms/buttons/button.tsx`)
- `UnitSectionCard` (`components/ui/unit-section-card.tsx`)
- `WorkoutNodeButton` (`components/ui/workout-node-button.tsx`)
- `StatCardLarge` (`components/molecules/cards/stat-card-large.tsx`)

O objetivo é que novas telas e fluxos sigam estes mesmos princípios, evitando decisões ad‑hoc.

---

## 1. Princípios de UX da aplicação

- **Clareza acima de tudo**: o usuário deve entender rapidamente o contexto (seção, objetivo) antes de qualquer ação.
- **Estado sempre explícito**: diferenças visuais claras entre estados (ativo, bloqueado, completo, carregando, desabilitado).
- **Feedback imediato**: cliques, hovers e carregamentos sempre geram respostas visuais (animação, sombra, ícone de loading).
- **Consistência entre módulos**: mesmos tokens de cor, tipografia, raios e sombras em toda a aplicação.
- **Gamificação saudável**: uso de cores vibrantes, sombras “físicas” e ícones (como estrela) para reforçar progresso e conquista.
- **Mobile‑first**: componentes desenhados para funcionar bem em telas pequenas; ajustes para desktop são incrementais.

---

## 2. Tokens de Design (Design Tokens)

### 2.1 Cores principais

- **Verde principal (duo-green)**  
  - Uso: ações primárias, cartões de seção (`UnitSectionCard`), destaque do `WorkoutNodeButton` quando atual/ativo.  
  - Exemplo de uso:

```tsx
className="bg-duo-green text-white"
```

- **Azul (duo-blue)**  
  - Uso: ícones de estatística padrão em `StatCardLarge`, links e botões de ação secundária quando apropriado.

- **Cores de suporte (`duo-orange`, `duo-yellow`, `duo-purple`, `duo-red`)**  
  - Uso: diferenciação semântica em estatísticas (`StatCardLarge.iconColor`), status especiais ou alertas.

- **Cinzas (fundos neutros e estados desabilitados)**  
  - Uso: estados bloqueados/indisponíveis (`WorkoutNodeButton` bloqueado, botões desabilitados).
  - Padrão visual: texto e ícones em cinza médio, fundo cinza claro, sombra reduzida ou inexistente.

### 2.2 Tipografia

- **Títulos de seção / unidades**:  
  - Peso: `font-extrabold`  
  - Tamanho: variando de `text-[20px]` a `text-2xl`  
  - Uso: `UnitSectionCard.title`, `StatCardLarge.value`

- **Labels / subtítulos**:  
  - Pequenos, em caixa alta quando for dado “de contexto” (ex.: label de seção)  
  - Exemplo: `sectionLabel` em `UnitSectionCard` utiliza `text-[13px]` com alto contraste.

- **Botões**:  
  - Sempre em **CAIXA ALTA**, `font-bold`, `tracking-wider` para reforçar ação.
  - Manter coerência em todos os `Button.variant`s.

### 2.3 Espaçamento e raio

- **Raios**  
  - Cartões principais: `rounded-[14px]` (`UnitSectionCard`).  
  - Botões padrão: `rounded-md` ou `rounded-2xl` conforme o tamanho.  
  - Botão de nó (`WorkoutNodeButton`): `borderRadius: "31.75px"` (pílula arredondada com forte identidade).

- **Espaçamento interno (padding)**  
  - Cartões: `px-4 py-[15px]` (consistentes entre seções).  
  - Botões: `px-4`, `px-6` conforme `size` (sm, default, lg).

### 2.4 Sombra e profundidade

- **Cartões e botões “clicáveis”** usam sombra simulando elevação física:
  - Ex.: `shadow-[0_4px_0_#58A700]` nos `Button` e `UnitSectionCard`.
  - Em estados `active`, removemos a sombra e aplicamos `translate-y-[4px]` para simular “aperto”.

- **Estados desabilitados/bloqueados**:
  - Sombra reduzida ou inexistente:
    - `WorkoutNodeButton` bloqueado: `0px 8px 0px rgba(0, 0, 0, 0.1), 0px 8px 0px #D1D5DB`
    - Botões desabilitados: `shadow-none` e cores em cinza.

---

## 3. Componente base – `Button`

Arquivo: `components/atoms/buttons/button.tsx`

### 3.1 Responsabilidade

- É o **átomo de ação primário** da aplicação.
- Deve encapsular:
  - Tipografia e caixa alta padrão de ações.
  - Cores e sombras coerentes com o estado.
  - Tratamento de `disabled` acessível (`disabled` + `aria-disabled`).
  - Possibilidade de composição via `asChild` (para uso com `Link`, por exemplo).

### 3.2 API de design

- **Variants principais (`variant`)**:
  - `default`: ação primária com fundo `bg-duo-green` e shadow verde.
  - `white`: ação secundária com fundo branco, texto verde.
  - `light-blue`: ação especial com fundo azul vibrante.
  - `disabled`: estilo explicitamente neutro e não clicável (útil para “chips” de status).
  - `destructive`: fundo vermelho claro, borda e sombra reforçando perigo/remoção.
  - `outline`: borda e fundo branco (ação secundária menos intrusiva).
  - `secondary`: fundo cinza claro / médio para ações de menor importância.
  - `ghost`: quase sem chrome visual, só texto, útil em contextos densos.
  - `link`: aparência de link, ideal para navegação leve.

- **Sizes (`size`)**:
  - `default`: altura ~50px, raio 2xl, texto ~13px.
  - `sm`, `lg`: variações para layouts mais compactos ou mais espaçosos.
  - `icon`, `icon-sm`, `icon-lg`: botões quadrados para ícones apenas (usado, por exemplo, no botão de edição de `UnitSectionCard`).

### 3.3 Padrões de interação

- **Hover**: leve alteração de cor (`hover:bg-*`) mantendo shadow.
- **Active**: shadow some, botão move `translate-y-[4px]` (efeito de “aperto”).
- **Disabled**:
  - `disabled:bg-[#E5E5E5]`, `disabled:text-[#AFAFAF]`, `disabled:shadow-none`, `disabled:cursor-not-allowed`.
  - Sempre evitar ações no `onClick` quando `disabled` estiver true.

### 3.4 Acessibilidade

- `aria-disabled` sincronizado com `disabled`.
- `focus-visible` com borda e ring claros (`focus-visible:border-ring` + `focus-visible:ring-[3px]`).
- Ícones dentro do botão não podem capturar interação: `[&_svg]:pointer-events-none`.

---

## 4. Componente de seção – `UnitSectionCard`

Arquivo: `components/ui/unit-section-card.tsx`

### 4.1 Propósito de UX

- Representa um **bloco de unidade/feature** (ex.: “Progresso”, “Peso”, “Treino atual”) com:
  - **Label de seção** (contexto breve).
  - **Título** forte (objetivo principal).
  - **Ação destacada** (edição ou navegação) ou ícone informativo à direita.

### 4.2 Estrutura visual

- Layout principal:
  - `flex flex-row items-center`, bordas arredondadas (`rounded-[14px]`), fundo `bg-duo-green`.
  - Sombra verde embaixo (`shadow-[0_4px_0_#48A502]`) para reforçar profundidade.
  - `overflow-hidden` para garantir consistência de corte do conteúdo.

- Lado esquerdo (conteúdo):
  - Coluna com:
    - **Label** (`sectionLabel`): `font-extrabold text-[13px]` com cor mais clara (`#CEF2AD`) – reforça hierarquia.
    - **Título** (`title`): `font-extrabold text-[20px]` em branco, `line-clamp-2` para evitar quebra visual.

- Lado direito:
  - **Ou** ícone (`icon`) centralizado, com borda esquerda.
  - **Ou** botão de ação (`Button` com ícone `Pencil`) para edição/navegação.

### 4.3 Estados e comportamento

- **Com ícone**:
  - Mostra apenas o ícone quando `icon` é fornecido e **não** há `buttonHref` nem `onButtonClick`.

- **Com botão**:
  - Quando `buttonHref` ou `onButtonClick` são passados:
    - Renderiza `Button variant="white" size="icon-lg"` com ícone de lápis (`Pencil`).
    - Se `buttonHref` é definido, o botão utiliza `asChild` com `Link` interno (ação de navegação).
    - Se apenas `onButtonClick` é definido, o botão dispara ação direta.
    - `isLoading` exibe `Loader2` animado e desabilita o botão.

### 4.4 Diretrizes de uso

- **Quando usar**:
  - Para agrupar informações de uma unidade com chamada para ação clara (ex.: “Editar meta”, “Ver detalhes”).
  - Em dashboards de aluno, cartões de progresso, módulos de acompanhamento.

- **Boas práticas**:
  - `sectionLabel`: sempre curto e descritivo, preferencialmente em caixa alta.
  - `title`: frase curta que comunica benefício ou estado atual (ex.: “Seu peso atual”, “Semana 4 do plano”).
  - Evitar colocar lógica de negócio dentro deste componente; ele é puramente de apresentação/composição.

---

## 5. Componente de progresso gamificado – `WorkoutNodeButton`

Arquivo: `components/ui/workout-node-button.tsx`

### 5.1 Propósito de UX

- Representa o **nó de progresso do treino** (ex.: aula, dia, bloco de treino) com uma estrela central.
- Comunica imediatamente:
  - Se o nó está **bloqueado**.
  - Se está **concluído**.
  - Se é o **nó atual**.

### 5.2 Estados visuais

- **Bloqueado (`isLocked`)**:
  - Fundo: cinza (`bg-[#E5E5E5]`).
  - Ícone `Star` em cinza (`text-[#AFAFAF]`).
  - Sombra: mais neutra, com aspecto de elemento “inativo”.
  - Cursor: `cursor-not-allowed`.
  - `onClick` é **ignorado** (preventDefault + stopPropagation).

- **Atual / não concluído**:
  - Fundo: `activeColor` (`#58CC02` – duo-green).
  - Sombra forte: `0px 8px 0px ...` com a mesma cor, reforçando estado atual.
  - Animação:
    - `whileHover`: leve aumento de escala (`scale: 1.05`, `y: -5`).
    - `whileTap`: `scale: 0.95`, `y: -3`.
    - `animate`: posição base `y: -5` (flutuação constante, chamando atenção).

- **Concluído (`isCompleted`)**:
  - Fundo: gradiente dourado (`from-[#FFD700] via-[#FFA500] to-[#FF8C00]`).
  - Ícone `Star` em branco.
  - Sombra em tom alaranjado (`#FFA500`).
  - Animações de hover/tap geralmente desnecessárias (já indica conquista).

### 5.3 Interação e motion

- Utiliza `motion.button` (framer‑motion via `motion/react`) para:
  - Hover / Tap com transições suaves (`transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}`).
  - Animação contínua do nó atual, reforçando foco do usuário.

- **Regra de negócio acoplada à UX**:
  - O componente **não dispara** `onClick` quando `isLocked` é true, garantindo que a UI não permita ações inválidas mesmo se o chamador esquecer de validar.

### 5.4 Diretrizes de uso

- Usar este botão como **único padrão visual** para nós de progresso de treino.
- Manter consistência dos estados:
  - Não adicionar novos estados sem antes definir semântica de negócio (ex.: “em revisão”, “pendente feedback”).
- Evitar sobrecarregar o nó com textos; para descrições, usar cards ou tooltips externos.

---

## 6. Componente de estatísticas – `StatCardLarge`

Arquivo: `components/molecules/cards/stat-card-large.tsx`

### 6.1 Propósito de UX

- Apresentar **métricas chave** (KPI) de forma visualmente destacada e fácil de escanear:
  - Valor principal (`value`).
  - Descrição (`label`).
  - Informação complementar opcional (`subtitle`) com cor semântica.

### 6.2 Estrutura visual

- Usa `DuoCard` como container padrão (mesma linguagem de cartão do projeto).
- Centralizado (`text-center`), ícone no topo, valor em destaque, legenda abaixo.
- Mapa de cores para ícone e texto do `subtitle`:
  - `iconColorMap` define classes `text-duo-*` (orange, yellow, blue, green, purple, red).

### 6.3 Padrões de uso

- **Valor (`value`)**:
  - Sempre em `text-2xl font-bold text-duo-text`.
  - Pode ser número ou string (ex.: `"72 kg"`, `"85%"`).

- **Label (`label`)**:
  - `text-xs text-duo-gray-dark` – rótulo descritivo (ex.: “Peso atual”, “Treinos concluídos na semana”).

- **Subtitle (`subtitle`)**:
  - Opcional.
  - Usa mesma cor do ícone (`iconColor`) para indicar tendência ou categoria (ex.: verde para melhoria, vermelho para alerta).

### 6.4 Semântica de cores em métricas (recomendado)

- `duo-green`: progresso positivo (ex.: “+3 treinos esta semana”).
- `duo-blue`: informação neutra ou geral.
- `duo-orange` / `duo-yellow`: avisos, atenção, metas quase atingidas.
- `duo-red`: estados críticos (queda de desempenho, lesão, etc.).

---

## 7. Padrões transversais de UX

### 7.1 Estados de carregamento

- Preferencialmente, usar ícones de loading consistentes:
  - Ex.: `Loader2` com `animate-spin`, como em `UnitSectionCard` quando `isLoading` é true no botão.
  - Regra: ao entrar em estado de loading, desabilitar ação para evitar cliques duplicados e garantir idempotência na borda de UI.

### 7.2 Responsividade

- Componentes devem:
  - Utilizar `flex` com `flex-1` e `min-w-0` onde necessário (`UnitSectionCard`) para evitar overflow em textos.
  - Depender de classes utilitárias do Tailwind para adaptar espaçamentos em breakpoints quando surgirem necessidades específicas.

### 7.3 Acessibilidade e foco

- Todos os elementos interativos:
  - Devem ser navegáveis por teclado.
  - Devem ter `focus-visible` claro e não omitido.
  - Devem sinalizar claramente quando estão desabilitados.

### 7.4 Erros e estados vazios

- **Erros**:
  - Devem reaproveitar paleta `destructive` (`destructive` variant em `Button`, `duo-red` em textos/ícones).
  - Sempre com mensagem clara, evitando apenas ícones.

- **Estados vazios**:
  - Combinar ícones e textos amigáveis.
  - Sugerir a próxima ação com um `Button` (variant `default` ou `light-blue`).

---

## 8. Como evoluir o sistema de design

- **Ao criar novos componentes**, seguir este fluxo:
  1. Verificar se o problema pode ser resolvido compondo `Button`, `UnitSectionCard`, `WorkoutNodeButton` e `StatCardLarge` (ou outros já existentes).
  2. Se precisar de um novo componente:
     - Definir claramente o propósito de UX e o contexto de uso.
     - Reutilizar tokens (cores, sombras, raios) em vez de inventar novos.
     - Garantir estados e feedbacks completos (hover, active, disabled, loading, erro).
  3. Atualizar este documento com:
     - Objetivo do componente.
     - Estados visuais.
     - Regras de uso.

- **Ao refinar componentes existentes**:
  - Manter compatibilidade visual (não quebrar a linguagem estabelecida).
  - Documentar no `.md` alterações relevantes de UX (por exemplo, mudança de semântica de cores).

Este sistema de design deve servir como referência viva para todo o time ao construir novas telas e fluxos na Gymrats.

