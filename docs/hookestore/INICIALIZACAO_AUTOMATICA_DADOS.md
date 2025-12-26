# Inicialização Automática dos Dados do Student

## 📋 Resumo

Implementação completa do carregamento automático de todos os dados do student via `/api/students/all` quando:
- O usuário faz login
- O app é carregado/refreshado e há uma sessão válida

Todos os dados são armazenados no Zustand store unificado (`stores/student-unified-store.ts`) e ficam disponíveis para uso em toda a aplicação.

## 🎯 Objetivo

Garantir que sempre que um usuário (STUDENT ou ADMIN) acessa o app, todos os seus dados sejam carregados automaticamente e armazenados no store Zustand, eliminando a necessidade de fazer múltiplas chamadas de API em diferentes componentes.

## 🏗️ Arquitetura

### 1. Hook de Inicialização (`hooks/use-student-initializer.ts`)

Hook que verifica se há uma sessão válida e carrega automaticamente os dados:

```typescript
import { useStudentInitializer } from "@/hooks/use-student-initializer";

// Uso básico
const { isInitialized, isLoading, hasError } = useStudentInitializer({
  autoLoad: true,
  onLoadStart: () => console.log("Iniciando carregamento..."),
  onLoadComplete: () => console.log("Dados carregados!"),
  onLoadError: (error) => console.error("Erro:", error),
});
```

**Características:**
- ✅ Verifica sessão automaticamente via `useUserSession()`
- ✅ Só carrega se o role for `STUDENT` ou `ADMIN`
- ✅ Evita múltiplas chamadas simultâneas (usando refs)
- ✅ Respeita cache: não recarrega se dados foram carregados há menos de 5 minutos
- ✅ Callbacks opcionais para feedback do processo

### 2. Integração no Login (`app/auth/login/page.tsx`)

Após login bem-sucedido, os dados são carregados automaticamente:

```typescript
// Carregar dados do student se for STUDENT ou ADMIN
if (userRole === "STUDENT" || userRole === "ADMIN") {
  // Carregar todos os dados do student em background
  loadAll().catch((err) => {
    console.error("Erro ao carregar dados do student após login:", err);
    // Não bloquear o redirecionamento em caso de erro
  });
  router.push("/student");
}
```

### 3. Integração no Layout do Student (`app/student/layout-content.tsx`)

O layout do student inicializa os dados automaticamente quando carrega:

```typescript
// Inicializar dados do student automaticamente quando o layout carregar
const { isLoading: isInitializingData } = useStudentInitializer({
  autoLoad: true,
});

// Mostrar loading enquanto inicializa
if (!isMounted || isInitializingData) {
  return <LoadingScreen variant="student" />;
}
```

### 4. Provider Global (Opcional) (`components/providers/student-data-provider.tsx`)

Provider que pode ser usado em qualquer lugar para inicializar dados:

```typescript
import { StudentDataProvider } from "@/components/providers/student-data-provider";

// No layout ou root
<StudentDataProvider showLoadingWhileInitializing={true}>
  {children}
</StudentDataProvider>
```

## 📦 Dados Carregados

Quando `loadAll()` é chamado, os seguintes dados são carregados via `/api/students/all`:

- ✅ **User Info**: Dados básicos do usuário
- ✅ **Student Info**: Informações do perfil de student
- ✅ **Progress**: XP, streak, level, achievements
- ✅ **Profile**: Altura, peso, objetivos, preferências
- ✅ **Weight History**: Histórico de peso
- ✅ **Units**: Workouts disponíveis
- ✅ **Workout History**: Histórico de workouts completados
- ✅ **Personal Records**: Recordes pessoais
- ✅ **Daily Nutrition**: Nutrição do dia atual
- ✅ **Subscription**: Dados de assinatura
- ✅ **Memberships**: Membrosias ativas
- ✅ **Payments**: Histórico de pagamentos
- ✅ **Payment Methods**: Métodos de pagamento salvos
- ✅ **Day Passes**: Diárias compradas
- ✅ **Friends**: Lista de amigos
- ✅ **Gym Locations**: Academias parceiras

## 🔄 Fluxo de Carregamento

### 1. Login
```
Login → Autenticação → Carrega dados em background → Redireciona
```

### 2. Refresh/App Load
```
App carrega → Verifica sessão → Se válida e STUDENT/ADMIN → Carrega dados
```

### 3. Cache Inteligente
```
Dados carregados há < 5 minutos? → Não recarrega
Dados carregados há > 5 minutos? → Recarrega
```

## 🎨 Uso nos Componentes

Após a inicialização, os dados estão disponíveis via `useStudent()`:

```typescript
import { useStudent } from "@/hooks/use-student";

// Acessar dados específicos
const { xp, level, streak } = useStudent("progress");
const weightHistory = useStudent("weightHistory");
const dailyNutrition = useStudent("dailyNutrition");

// Acessar tudo
const studentData = useStudent();

// Acessar actions
const { addWeight, updateProgress } = useStudent("actions");

// Acessar loaders (para recarregar seções específicas)
const { loadNutrition, loadProgress } = useStudent("loaders");
```

## 🔧 Configuração

### Desabilitar Auto-Load

Se necessário, você pode desabilitar o carregamento automático:

```typescript
useStudentInitializer({
  autoLoad: false, // Não carrega automaticamente
});
```

### Carregamento Manual

Para carregar manualmente:

```typescript
const { loadAll } = useStudentUnifiedStore((state) => ({
  loadAll: state.loadAll,
}));

// Carregar todos os dados
await loadAll();
```

## 📝 Notas Importantes

1. **Performance**: O carregamento é feito em background e não bloqueia a UI
2. **Cache**: Dados são persistidos no localStorage via Zustand persist
3. **Erros**: Erros não bloqueiam o fluxo da aplicação
4. **Sessão**: Só carrega se houver sessão válida e role STUDENT/ADMIN
5. **Duplicação**: Mecanismos de proteção evitam múltiplas chamadas simultâneas

## 🚀 Próximos Passos

- [ ] Adicionar retry automático em caso de erro
- [ ] Implementar sincronização periódica em background
- [ ] Adicionar indicadores visuais de sincronização
- [ ] Otimizar carregamento incremental (carregar apenas seções necessárias)

## 📚 Arquivos Relacionados

- `hooks/use-student-initializer.ts` - Hook de inicialização
- `hooks/use-student.ts` - Hook principal para acessar dados
- `stores/student-unified-store.ts` - Store Zustand unificado
- `app/auth/login/page.tsx` - Página de login
- `app/student/layout-content.tsx` - Layout do student
- `components/providers/student-data-provider.tsx` - Provider opcional
- `lib/api/auth.ts` - API de autenticação

