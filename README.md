# IEC Inventário TI

Sistema interno de controle de inventário de TI do IEC. Desenvolvido com Next.js 14+, Prisma, NextAuth e Supabase.

## Stack

- **Framework:** Next.js 14+ com App Router
- **Linguagem:** TypeScript
- **ORM:** Prisma (Supabase/PostgreSQL)
- **Autenticação:** NextAuth.js Credentials (e-mail + senha bcrypt)
- **Tabelas:** TanStack Table v8 com paginação server-side
- **Forms:** React Hook Form + Zod
- **Notificações:** Sonner

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar `.env`

```env
DATABASE_URL="postgresql://postgres:SENHA@db.SEU-PROJETO.supabase.co:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-com-openssl-rand-base64-32"
```

Gere o secret:
```bash
openssl rand -base64 32
```

### 3. Criar tabela de usuários no Supabase SQL Editor

```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'viewer',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Sincronizar Prisma

```bash
npm run db:validate  # valida migrations e schema Prisma
npx prisma generate  # gera o client
```

> O schema do banco é versionado por migrations em `supabase/migrations`.
> Use `prisma db pull` somente quando for capturar deliberadamente um novo
> snapshot do banco, conforme `docs/database-versioning.md`.

### 5. Criar primeiro usuário admin

```bash
# Gerar hash da senha
node -e "const b = require('bcryptjs'); b.hash('suaSenha123', 10).then(console.log)"
```

```sql
INSERT INTO usuarios (nome, email, senha_hash, perfil)
VALUES ('Admin', 'admin@iec.com.br', '$2a$10$HASH_AQUI', 'admin');
```

### 6. Rodar

```bash
npm run dev
# Acesse http://localhost:3000
```

## Estrutura

```
app/
├── (auth)/login/         → Tela de login
├── (dashboard)/          → Layout sidebar + telas
│   ├── page.tsx          → Dashboard com stats, solicitações, movimentações
│   ├── colaboradores/
│   ├── maquinas/
│   ├── notebooks/
│   ├── aparelhos/
│   ├── impressoras/
│   ├── ramais/
│   ├── racks/
│   ├── movimentacoes/
│   └── solicitacoes/
└── api/                  → API Routes server-side

components/
├── layout/               → Sidebar colapsável, PageHeader
├── dashboard/            → StatsCards, badges de status/prioridade
├── tables/               → DataTable genérico TanStack
└── modals/               → Painéis laterais de detalhe

lib/
├── prisma.ts             → Singleton Prisma Client
├── auth.ts               → NextAuth config
└── utils.ts              → formatDate, mapTipoDispositivo, etc.
```

## Roadmap

- [ ] Exportação CSV/Excel
- [ ] Formulários de edição de ativos
- [ ] Rota admin para gestão de usuários
- [ ] Relatórios por setor
- [ ] Histórico de alocações por colaborador

## Docs

- [Versionamento do banco](docs/database-versioning.md)
- [Testes](docs/testing.md)
