# Catálogo de Access Control e Regras de Negócio Híbridas (RBAC/ABAC)

Este documento foi gerado a partir de uma varredura completa nas regras de negócio da plataforma GymRats. Ele mapeia "Quem pode fazer O Quê", "Como", "Quando" e o mais importante: os "Edge Cases" (cascatas de eventos e heranças indiretas) onde uma ação de um perfil causa impacto nos recursos de outro.

---

## 🏛️ 1. Matriz de Perfis (Roles)

O sistema hoje possui 4 grandes "Role Actors", mapeados centralmente:
- **`STUDENT` (Aluno):** Foca em progressão de treinos diários, dietas (geradas por IA ou pelo seu Personal/Gym) e acompanhamento de biofísica.
- **`GYM` (Academia):** Entidade administrativa B2B. O núcleo financeiro gira aqui, cadastrando alunos, recebendo pagamentos PIX/cartão e acompanhando Check-ins e Hardware.
- **`PERSONAL` (Treinador):** *Nova funcionalidade planejada.* Atua conectando-se aos Students para entregar treinos especializados e dieta, possivelmente vendendo serviços pontuais.
- **`ADMIN`:** By-pass de acesso absoluto e criador de catálogos globais.

---

## 🎯 2. Quem detém a Feature vs. Quem Ativa a Feature

Um dos maiores desafios da engenharia do acesso foi dissociar **Interface (Feature) x Direito (Authorization)**.

### Exemplo de Dissociação: Prescrição de Dietas e Treinos
- O **Student** interage e possui as features de leitura e preenchimento de Dietas (UI Cards `DietPlan`, `Workouts`). Porém um Student `FREE` não pode criar a própria dieta complexa com IA automaticamente.
- A **Gym** (ou o **Personal**) é a entidade com "poder de assinalamento" (`ASSIGN_WORKOUTS`, `ASSIGN_DIETS`). Elas criam os cards na tela do aluno.
- **Conclusão de Regra:** A restrição *não é esconder a tela* do Aluno. Ele tem a tela. A restrição é bloquear as ferramentas de "Autocriação Automática", limitando a ter as coisas populadas pelo Administrador (Academia) caso o aluno seja FREE ou, se o próprio Aluno assinar o `PREMIUM`/`PRO`, ele mesmo aperta o botão de AI Prompt.

---

## 🎭 3. A Herança Relacional Mágica (ABAC - Context-Aware Access)

O maior nível de complexidade e diferencial da plataforma ocorre no motor de herança relacional de benefícios. A função ABAC `checkAbility(UserContext, Feature, EnvironmentContext)` age em tempo real avaliando a cascata hierárquica.

### A. Fluxo Escalonado de Alunos dentro de Academias
Um usuário `STUDENT` tem a assinatura matriz na tabela `Subscription`. No entanto, os seus recursos podem sofrer override imediato de herança se ele for atrelado a um `Environment` de Academia rica.

**A Cascata (`GymInheritedFeatures`):**
1. O motor bate no banco e valida se o User tem plano `PRO`. Se sim: Destrava tudo. Se não, vai pro passo 2.
2. O Motor verifica: Ele tem conexão ativa (Membership Ativa) com a `Gym-Z`?
3. Se a `Gym-Z` estiver pagando o Plano Matriz de Academias de Nível `ENTERPRISE`, o motor encontra que essa Gym "Distribui/Herda" a tag de `[Features.USE_AI_WORKOUT, Features.USE_AI_NUTRITION]` para todos os matriculados dela.
4. O aluno pode usar I.A em tempo real "patrocinado" pela Academia.

---

## 💣 4. O Efeito Dominó (Cascading Edge Cases) - Catálogo Crítico

Aqui listamos os casos de uso complexos onde há interdependências severas de banco de dados e as políticas precisam atuar no formato de "gatilho" (Efeito Dominó).

### Edge Case 1: Inadimplências Cruzadas (Multiple Gyms Fallback)
E se o dono de Academias, visando o crescimento da sua rede, montar um império de franquias?
- **Premissa Inicial:** A API `/api/gyms/create/route.ts` exige que, a partir da segunda academia criada na conta do usuário `GYM`, exista pelo menos 1 assinatura Paga Ativa na Rede.
- **Trama:**
  - `Academia Primária`: Paga a Abacate Pay pelo plano `PREMIUM`.
  - `Academia Secundária`: O dono vai lá e cria e, para ostentar, sobe ela pro Plano `ENTERPRISE`.
  - Nessa Segunda Academia "Enterprise", os alunos cadastrados por ela estão desfrutando de `Herança de I.A` graças ao plano desta unidade.
- **O Trigger Crítico (O Dia do Calote):**
  - O Dono não paga a primeira e principal `Academia Primária (PREMIUM)`.
  - O Webook do Abacate Pay rebaixa/inativa a Primária.
- **A Regra Escrita em Pedra (O Efeito Dominó para Implementar na Refatoração):**
  - O Cron de validação nota que o CNPJ / Owner não possui mais a infraestrutura base pagante (já que a primeira falhou e ela era o requisito das "múltiplas academias").
  - O sistema suspende temporariamente a `Academia Secundária (ENTERPRISE)`.
  - Com o plano `ENTERPRISE` inativo, todos os Alunos (agora sem herança ambiente pagante), perdem Imediatamente o acesso e seus cadeados na UI se fecham. A menos, é claro, que algum deles, independentemente, tenha pago os "R$ 6,00" do plano Premium avulso, que atua como plano nativo na sua conta de estudante.

### Edge Case 2: Multi-Membro de Academias e A Herança Majoritária
Um Aluno viciado que participa de 2 academias simultaneamente (Crossfit A + Musculação B).
- A Academia "A" tem plano `BASIC` (Não dá brindes de IA).
- A Academia "B" fechou plano `ENTERPRISE` (Dá brinde de I.A e relatórios avançados para o personal dele).
- **Regra do Motor ABAC:** O hook `useAbility` no App consumirá as `environment tags`. Se o Contexto do aluno apontar que ele "existe" matriculado na B, o passe de herança dele se torna Universal enquanto a submissão exata (membership status) dentro da B estiver marcada ativamente.  

### Edge Case 3: O Personal Multiatendimento vs Status da Academia
A Feature `ASSIGN_PERSONAL` (Academia colocar um Profissional para cuidar de X alunos):
- **Premissa:** Isso é privilégio de quem assina plano Gym `ENTERPRISE`.
- **Regra:** Se a Academia Downgradeia para o `PREMIUM` (que perde a feature), o que acontece com os Personals já atrelados aos alunos?
- **O Efeito:** As conexões (`Assignments`) passadas **NÃO SUMIRÃO** do banco (histórico e logbook são sagrados). Porém, a Academia e o Personal perdem o botão de UI de `Update Workout` e visualização diária da rotina ("View Progress" block). Ou seja, se congela os metadados.

### Edge Case 4: DayPasses Limitadores em Plano Base Gym
- A Academia Basic pode ser restrita a receber pagamentos / check-ins para matriculados apenas. Venda solta de PIX / Cartão avulso por passe diário (Daypass via Marketplace com abacate pay do próprio App) pode ser um feature flag "unlock" de planos *Premium/Enterprise*.

---

## 🛠️ 5. Próximos Passos Baseados Neste Mapeamento

Saber dessas cascatas exige que as reestruturações não só adicionem variáveis novas aos Hooks do front-end, mas que os **Webhooks do Servidor** que escutam o Status de Pagamentos (Abacate Pay) estejam munidos de Jobs/Listeners rigorosos:

Evento Central: AbacatePay cancelou/inativou assinatura da "Academia A" do Dono "Y".
1. A API marca Gym "A" como plano `BASIC`.
2. O sistema mapeia se há Gym "B/C/D" deste owner e Inativa o status delas (`limit_exceeded`).
3. O sistema roda sincronização (`syncStudentEnterpriseBenefit`) desativando a herança de I.A de TODOS os alunos listados na Academia B Inativada e na Academia A que decaiu.

O Core Estrutural de segurança (`lib/access-control/core.ts`) não precisará guardar em banco o cálculo de Herança (ele não atualiza `usuarioX tem IA: true`), pois ele faz o cálculo instintivo na hora do Clique Baseado no Contexto. Menos chance de dessincronização no Banco de Dados!
