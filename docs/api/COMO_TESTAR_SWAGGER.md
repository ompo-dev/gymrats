# 🧪 COMO TESTAR O SWAGGER

## 🚀 Iniciar o Servidor

Se o servidor não estiver rodando, execute:

```bash
npm run dev
```

O servidor iniciará em `http://localhost:3000` (ou a porta configurada).

## 📖 Acessar o Swagger

### Opção 1: Visualizar JSON Direto
Acesse diretamente no navegador:
```
http://localhost:3000/api/swagger
```

Isso retornará o JSON do Swagger/OpenAPI.

### Opção 2: Usar Swagger UI (Recomendado)

#### Instalar Swagger UI (opcional)
```bash
npm install swagger-ui-react
```

#### Ou usar Swagger Editor Online
1. Acesse: https://editor.swagger.io/
2. Cole o JSON de `http://localhost:3000/api/swagger`
3. Visualize a documentação interativa

### Opção 3: Criar Página Swagger UI

Criar uma página em `app/swagger/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Carregar Swagger UI apenas no cliente
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })
import 'swagger-ui-react/swagger-ui.css'

export default function SwaggerPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    fetch('/api/swagger')
      .then(res => res.json())
      .then(data => setSpec(data))
  }, [])

  if (!spec) return <div>Carregando...</div>

  return <SwaggerUI spec={spec} />
}
```

## 🧪 Testar Endpoints

### 1. Testar Autenticação

```bash
# Registrar
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@email.com","password":"senha123456"}'

# Login
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","password":"senha123456"}'
```

### 2. Testar Students

```bash
# Buscar todos os dados
curl http://localhost:3000/api/students/all \
  -H "Cookie: auth_token=SEU_TOKEN_AQUI"

# Buscar perfil
curl http://localhost:3000/api/students/profile \
  -H "Cookie: auth_token=SEU_TOKEN_AQUI"
```

### 3. Testar Gyms

```bash
# Listar academias
curl http://localhost:3000/api/gyms/list \
  -H "Cookie: auth_token=SEU_TOKEN_AQUI"

# Criar academia
curl -X POST http://localhost:3000/api/gyms/create \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=SEU_TOKEN_AQUI" \
  -d '{"name":"Academia Teste","address":"Rua Teste","phone":"123456789","email":"academia@teste.com"}'
```

## 🔍 Verificar Estrutura

### Verificar se Swagger está correto:
```bash
# Ver JSON do Swagger
curl http://localhost:3000/api/swagger | jq .
```

### Validar OpenAPI Spec:
1. Acesse: https://editor.swagger.io/
2. Cole o JSON de `/api/swagger`
3. Verifique se há erros de validação

## 📝 Notas

- Todas as rotas que requerem autenticação precisam do cookie `auth_token` ou header `Authorization: Bearer TOKEN`
- O Swagger está expandido com todas as tags e rotas principais
- Schemas estão definidos para os principais recursos
- Responses padronizadas estão configuradas

## 🐛 Troubleshooting

### Swagger não carrega
- Verifique se o servidor está rodando
- Verifique se há erros no console
- Verifique se `/api/swagger` retorna JSON válido

### Erros 401
- Faça login primeiro para obter o token
- Use o cookie `auth_token` ou header `Authorization`

### Erros 500
- Verifique os logs do servidor
- Verifique se o banco de dados está configurado
- Verifique se as migrations foram aplicadas

---

**URL do Swagger:** `http://localhost:3000/api/swagger`
**Status:** ✅ Pronto para testes

