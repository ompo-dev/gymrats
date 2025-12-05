# 📚 Documentação Swagger/OpenAPI

Este documento explica como usar a documentação Swagger da API do Fitness App.

## 🚀 Acessando a Documentação

A documentação Swagger está disponível em duas formas:

### 1. Interface Web (Swagger UI)

Acesse a interface visual em:
```
http://localhost:3000/api-docs
```

Esta página fornece uma interface interativa onde você pode:
- ✅ Ver todas as rotas disponíveis
- ✅ Testar as APIs diretamente no navegador
- ✅ Ver exemplos de request/response
- ✅ Ver esquemas de validação

### 2. Especificação OpenAPI (JSON)

Acesse a especificação completa em formato JSON:
```
http://localhost:3000/api/swagger
```

Este endpoint retorna a especificação OpenAPI 3.0 completa que pode ser:
- Importada em ferramentas como Postman, Insomnia
- Usada para gerar clientes SDK
- Integrada em outras ferramentas de documentação

## 📋 APIs Documentadas

### Autenticação

#### 1. Criar Conta (`POST /api/auth/sign-up`)
- **Descrição**: Registra um novo usuário no sistema
- **Autenticação**: Não requerida
- **Body**:
  ```json
  {
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "senhaSegura123"
  }
  ```
- **Resposta**: Retorna usuário e token de sessão

#### 2. Fazer Login (`POST /api/auth/sign-in`)
- **Descrição**: Autentica um usuário e retorna sessão
- **Autenticação**: Não requerida
- **Body**:
  ```json
  {
    "email": "joao@email.com",
    "password": "senhaSegura123"
  }
  ```
- **Resposta**: Retorna usuário e token de sessão
- **Cookies**: Define cookie `auth_token` automaticamente

#### 3. Verificar Sessão (`GET /api/auth/session`)
- **Descrição**: Retorna informações da sessão atual
- **Autenticação**: Requerida (Bearer token ou cookie)
- **Headers**:
  ```
  Authorization: Bearer {token}
  ```
  ou
  ```
  Cookie: auth_token={token}
  ```
- **Resposta**: Retorna dados do usuário e sessão

#### 4. Fazer Logout (`POST /api/auth/sign-out`)
- **Descrição**: Encerra a sessão atual
- **Autenticação**: Requerida (Bearer token ou cookie)
- **Resposta**: Retorna `{ success: true }`
- **Cookies**: Remove cookie `auth_token`

### Usuários

#### 5. Atualizar Tipo de Usuário (`POST /api/auth/update-role`)
- **Descrição**: Atualiza o role e tipo de um usuário
- **Autenticação**: Requerida
- **Body**:
  ```json
  {
    "userId": "clx1234567890",
    "role": "STUDENT",
    "userType": "student"
  }
  ```
- **Resposta**: Retorna sucesso e dados atualizados

## 🔐 Autenticação

As APIs que requerem autenticação aceitam duas formas:

### 1. Bearer Token (Header)
```
Authorization: Bearer {seu_token_aqui}
```

### 2. Cookie
O cookie `auth_token` é definido automaticamente após login/signup e pode ser usado automaticamente pelo navegador.

## 🧪 Testando no Swagger UI

1. **Acesse** `http://localhost:3000/api-docs`

2. **Para testar autenticação:**
   - Primeiro, faça um POST em `/api/auth/sign-up` ou `/api/auth/sign-in`
   - Copie o `token` da resposta
   - Clique no botão "Authorize" no topo da página
   - Cole o token no campo "Bearer" ou use o cookie automaticamente

3. **Para testar rotas protegidas:**
   - Após autenticar, você pode testar `/api/auth/session` e outras rotas protegidas
   - O Swagger UI enviará automaticamente o token nos headers

## 📝 Exemplos de Uso

### Criar uma conta
```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "senhaSegura123"
  }'
```

### Fazer login
```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "senhaSegura123"
  }'
```

### Verificar sessão (com token)
```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Authorization: Bearer {seu_token_aqui}"
```

## 🔧 Validações

### Sign Up
- ✅ Nome obrigatório
- ✅ Email obrigatório e válido
- ✅ Senha obrigatória com mínimo de 8 caracteres
- ✅ Email deve ser único

### Sign In
- ✅ Email obrigatório
- ✅ Senha obrigatória
- ✅ Credenciais devem ser válidas

### Atualizar Role
- ✅ userId obrigatório
- ✅ role deve ser "STUDENT" ou "GYM"
- ✅ userType deve ser "student" ou "gym"
- ✅ Usuário deve existir

## 📦 Estrutura de Respostas

### Sucesso
```json
{
  "user": {
    "id": "clx1234567890",
    "email": "joao@email.com",
    "name": "João Silva",
    "userType": "student",
    "role": "STUDENT"
  },
  "session": {
    "token": "session-1234567890-abc123"
  }
}
```

### Erro
```json
{
  "error": "Mensagem de erro descritiva"
}
```

## 🎯 Próximos Passos

- [ ] Adicionar mais endpoints conforme desenvolvidos
- [ ] Adicionar exemplos mais detalhados
- [ ] Adicionar autenticação OAuth (Google)
- [ ] Adicionar endpoints de treinos
- [ ] Adicionar endpoints de academias
- [ ] Adicionar endpoints de progresso

## 📖 Recursos

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

