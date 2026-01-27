# Padrões de commits 📜

Seguimos o padrão de commits semânticos baseado em Conventional Commits,
com **emoji obrigatório no início**. Isso mantém o histórico claro e
automatizável.

## Tipo e descrição 🦄

Estrutura:

```
<emoji> <type>(opcional-escopo): <descrição>
```

Tipos aceitos:

- `feat` novo recurso
- `fix` correção de bug
- `docs` documentação
- `test` testes
- `build` build/dependências
- `perf` performance
- `style` formatação (sem mudança lógica)
- `refactor` refatoração sem alterar funcionalidade
- `chore` tarefas auxiliares
- `ci` integração contínua
- `raw` configs/dados/parâmetros
- `cleanup` limpeza de código
- `remove` remoção de arquivos/funcionalidades
- `init` commit inicial

Recomendações:

- Na primeira linha, use **no máximo 4 palavras** na descrição.
- Use **emoji** no início da mensagem.
- Links devem ser completos (sem encurtadores).

## Complementos do commit 💻

**Corpo**: detalhes e impactos.

**Rodapé**: revisor e referência de tarefa.

Exemplo:

```
Reviewed-by: Nome Sobrenome
Refs #133
```

## Padrões de emojis 💈

| Tipo | Emoji | Palavra-chave |
|---|---|---|
| Acessibilidade | ♿ :wheelchair: | |
| Adicionando teste | ✅ :white_check_mark: | test |
| Atualizando versão | ⬆️ :arrow_up: | |
| Retrocedendo versão | ⬇️ :arrow_down: | |
| Adicionando dependência | ➕ :heavy_plus_sign: | build |
| Alterações de revisão | 👌 :ok_hand: | style |
| Animações/transições | 💫 :dizzy: | |
| Bugfix | 🐛 :bug: | fix |
| Comentários | 💡 :bulb: | docs |
| Commit inicial | 🎉 :tada: | init |
| Configuração | 🔧 :wrench: | chore |
| Deploy | 🚀 :rocket: | |
| Documentação | 📚 :books: | docs |
| Em progresso | 🚧 :construction: | |
| Estilização de UI | 💄 :lipstick: | feat |
| Infraestrutura | 🧱 :bricks: | ci |
| Lista de ideias | 🔜 :soon: | |
| Mover/Renomear | 🚚 :truck: | chore |
| Novo recurso | ✨ :sparkles: | feat |
| Package.json | 📦 :package: | build |
| Performance | ⚡ :zap: | perf |
| Refatoração | ♻️ :recycle: | refactor |
| Limpeza de código | 🧹 :broom: | cleanup |
| Remoção | 🗑️ :wastebasket: | remove |
| Remover dependência | ➖ :heavy_minus_sign: | build |
| Responsividade | 📱 :iphone: | |
| Reverter | 💥 :boom: | fix |
| Segurança | 🔒️ :lock: | |
| SEO | 🔍️ :mag: | |
| Tag de versão | 🔖 :bookmark: | |
| Testes | 🧪 :test_tube: | test |
| Texto | 📝 :pencil: | |
| Tipagem | 🏷️ :label: | |
| Tratamento de erros | 🥅 :goal_net: | |
| Dados | 🗃️ :card_file_box: | raw |

## Exemplos 💻

- `🎉 init: Commit inicial`
- `📚 docs: Atualização do README`
- `🐛 fix: Loop infinito na linha 50`
- `✨ feat: Página de login`
- `🧱 ci: Modificação no Dockerfile`
- `♻️ refactor: Passando para arrow functions`
- `⚡ perf: Melhoria no tempo de resposta`
- `🧪 test: Criando novo teste`
- `🧹 cleanup: Removendo código comentado`
- `🗑️ remove: Removendo arquivos não utilizados`

## Husky

O hook `commit-msg` valida o padrão automaticamente.
Para instalar:

```
bun run prepare
```
