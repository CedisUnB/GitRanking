# TCC Gamification 🎮

Sistema de gamificação desenvolvido com Next.js, TypeScript e Supabase + Prisma.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta Supabase (https://supabase.com) -> Ou criar seu banco de dados de outra forma

## 🚀 Como Rodar o Sistema

### 1. Clonar o repositório
```bash
git clone <seu-repositorio>
cd tcc-gamification
```

### 2. Instalar dependências
```bash
cd frontend
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na pasta `frontend/` (copie de `.env.example`):

```bash
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres"
```

**Onde obter a senha:**
- Acesse sua conta Supabase
- Vá em **Settings** → **Database**
- Copie a **Connection string** (tipo URI)

### 4. Atualizar o banco de dados com Prisma

Toda vez que alterar o schema, execute:

```bash
npm run prisma migrate dev --name descricao_da_mudanca
```

**Exemplos:**
```bash
# Criar tabela de usuários
npm run prisma migrate dev --name add_users_table

# Adicionar campo a uma tabela
npm run prisma migrate dev --name add_email_field_to_users
```

### 5. Iniciar o servidor

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

---

## 📦 Comandos Principais do Prisma

```bash
# Sincronizar schema com banco (sem criar migrations)
npm run prisma db push

# Visualizar dados no banco (UI interativa)
npm run prisma studio

# Resetar banco de dados (⚠️ CUIDADO: deleta tudo!)
npm run prisma migrate reset

# Visualizar status das migrations
npm run prisma migrate status
```

---

## 📁 Estrutura do Projeto

```
frontend/
├── app/             # Páginas do Next.js
├── components/      # Componentes React
├── lib/             # Utilitários (prisma.ts, etc)
├── prisma/
│   ├── schema.prisma    # Definição do banco de dados
│   └── migrations/      # Histórico de mudanças
├── .env            # Variáveis de ambiente (NÃO commitar)
├── .env.example    # Modelo do .env
└── package.json
```

---

## 🔄 Workflow de Desenvolvimento

1. **Editar schema.prisma**
   ```prisma
   model User {
     id    Int     @id @default(autoincrement())
     email String  @unique
     name  String?
   }
   ```

2. **Criar migration**
   ```bash
   npm run prisma migrate dev --name add_users
   ```

3. **Usar no código**
   ```typescript
   import { prisma } from "@/lib/prisma";

   // GET
   const user = await prisma.user.findUnique({
     where: { email: "test@example.com" }
   });

   // CREATE
   const newUser = await prisma.user.create({
     data: { email: "novo@example.com", name: "João" }
   });

   // UPDATE
   await prisma.user.update({
     where: { id: 1 },
     data: { name: "João Silva" }
   });

   // DELETE
   await prisma.user.delete({
     where: { id: 1 }
   });
   ```

---

## 🆘 Troubleshooting

### ❌ "DATABASE_URL not set"
- Verifique se `.env.local` existe
- Verifique se copiou a connection string corretamente
- Reinicie o servidor (`Ctrl+C` e `npm run dev`)

### ❌ "Could not connect to database"
- Verifique se a senha está correta
- Verifique se seu projeto Supabase está ativo
- Tente resetar a senha no dashboard do Supabase

### ❌ "Migration conflicts"
- Execute `npm run prisma migrate reset` (⚠️ deleta dados!)
- Ou sincronize manualmente via Supabase console

---

## 📚 Documentação Importante

- [Prisma Docs](https://www.prisma.io/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

## 👨‍💻 Autor

Desenvolvido para o TCC - Gamificação