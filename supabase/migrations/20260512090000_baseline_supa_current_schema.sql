-- Baseline generated from the current Supabase production schema.
-- Source snapshot: supabase/schema-snapshots/20260512141918_supa_current_schema.prisma
-- This migration is intended for fresh local/CI databases only.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CreateEnum
CREATE TYPE "categoria_equipamento" AS ENUM ('Administrativa', 'Academica');

-- CreateEnum
CREATE TYPE "status_colaborador" AS ENUM ('Ativo', 'Inativo');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" TEXT DEFAULT 'viewer',
    "ativo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setores" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaboradores" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "codigo" INTEGER,
    "nome" TEXT NOT NULL,
    "setor" TEXT,
    "status" "status_colaborador" NOT NULL DEFAULT 'Ativo',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "setor_id" UUID,

    CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maquinas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome_host" TEXT,
    "identificador" TEXT,
    "fabricante" TEXT,
    "modelo" TEXT,
    "categoria" "categoria_equipamento",
    "tipo" TEXT,
    "processador" TEXT,
    "memoria_ram" TEXT,
    "armazenamento" TEXT,
    "endereco_ip" TEXT,
    "localizacao" TEXT,
    "setor" TEXT,
    "patrimonio_cpu" TEXT,
    "patrimonio_monitor" TEXT,
    "data_revisao" DATE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "setor_id" UUID,

    CONSTRAINT "maquinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notebooks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "modelo" TEXT,
    "fabricante" TEXT,
    "categoria" "categoria_equipamento",
    "processador" TEXT,
    "memoria" TEXT,
    "armazenamento" TEXT,
    "numero_patrimonio" TEXT,
    "setor" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "setor_id" UUID,
    "emprestado" BOOLEAN NOT NULL DEFAULT false,
    "emprestado_setor_id" UUID,
    "emprestado_colaborador_id" UUID,
    "emprestado_desde" DATE,
    "emprestado_obs" TEXT,
    "data_revisao" DATE,

    CONSTRAINT "notebooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aparelhos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "modelo" TEXT,
    "tipo" INTEGER,
    "chip" BOOLEAN DEFAULT false,
    "endereco_ip" TEXT,
    "endereco_mac" TEXT,
    "setor" TEXT,
    "status" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "setor_id" UUID,

    CONSTRAINT "aparelhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impressoras" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome_host" TEXT,
    "fabricante" TEXT,
    "modelo" TEXT,
    "numero_serie" TEXT,
    "endereco_ip" TEXT,
    "localidade" TEXT,
    "andar" TEXT,
    "servidor_impressao" TEXT,
    "identificador_selb" TEXT,
    "tipo_usuario" TEXT,
    "revisao" TIMESTAMPTZ(6),
    "status" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "setor_id" UUID,

    CONSTRAINT "impressoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ramais" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "numero_ramal" TEXT,
    "nome_setor" TEXT,
    "prefixo_telefonico" TEXT,
    "disponibilidade" TEXT,
    "fila" BOOLEAN DEFAULT false,
    "contemplacao" BOOLEAN DEFAULT false,
    "status_contemplacao" INTEGER,
    "senha_acesso" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "setor_id" UUID,
    "password" TEXT,

    CONSTRAINT "ramais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "racks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome_switch" TEXT,
    "marca_switch" TEXT,
    "localizacao" TEXT,
    "numero_patrimonio" TEXT,
    "quantidade_portas" INTEGER,
    "portas_em_uso" INTEGER,
    "portas_livres" INTEGER,
    "portas_academicas" TEXT,
    "portas_vlan_impressoras" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "setor_id" UUID,

    CONSTRAINT "racks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alocacoes_maquinas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "colaborador_id" UUID,
    "maquina_id" UUID,
    "data_inicio" DATE,
    "data_fim" DATE,
    "tipo_uso" INTEGER,
    "ativo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alocacoes_maquinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alocacoes_notebooks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "colaborador_id" UUID,
    "notebook_id" UUID,
    "data_inicio" DATE,
    "data_fim" DATE,
    "motivo_alocacao" TEXT,
    "tipo_posse" INTEGER,
    "ativo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alocacoes_notebooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alocacoes_aparelhos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "colaborador_id" UUID,
    "aparelho_id" UUID,
    "data_inicio" DATE,
    "data_fim" DATE,
    "descricao_alocacao" TEXT,
    "motivo_alocacao" TEXT,
    "tipo_uso" INTEGER,
    "observacoes" TEXT,
    "ativo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alocacoes_aparelhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alocacoes_ramais" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "colaborador_id" UUID,
    "ramal_id" UUID,
    "data_inicio" DATE,
    "data_fim" DATE,
    "tipo_base" INTEGER,
    "canal_adicional" TEXT,
    "whatsapp" BOOLEAN DEFAULT false,
    "ativo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alocacoes_ramais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "data_movimentacao" DATE,
    "identificador_dispositivo" TEXT,
    "tipo_dispositivo" INTEGER,
    "tipo_movimentacao" INTEGER,
    "colaborador_id" UUID,
    "setor" TEXT,
    "tecnico_responsavel" TEXT,
    "observacao" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "data_criacao" DATE,
    "colaborador_relacionado" TEXT,
    "identificador_dispositivo" TEXT,
    "tipo_dispositivo" INTEGER,
    "tipo_solicitacao" INTEGER,
    "status_solicitacao" INTEGER,
    "prioridade" INTEGER,
    "origem_solicitacao" INTEGER,
    "solicitante" TEXT,
    "observacao" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tabela" TEXT NOT NULL,
    "registro_id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "descricao" TEXT,
    "dados_anteriores" JSONB,
    "dados_novos" JSONB,
    "usuario_id" UUID,
    "usuario_nome" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "setores_nome_key" ON "setores"("nome");

-- CreateIndex
CREATE INDEX "idx_setores_ativo" ON "setores"("ativo");

-- CreateIndex
CREATE INDEX "idx_setores_nome" ON "setores"("nome");

-- CreateIndex
CREATE INDEX "idx_colaboradores_nome" ON "colaboradores"("nome");

-- CreateIndex
CREATE INDEX "idx_colaboradores_setor" ON "colaboradores"("setor");

-- CreateIndex
CREATE INDEX "idx_maquinas_identificador" ON "maquinas"("identificador");

-- CreateIndex
CREATE INDEX "idx_maquinas_setor" ON "maquinas"("setor");

-- CreateIndex
CREATE INDEX "idx_notebooks_emprestado_colab" ON "notebooks"("emprestado_colaborador_id");

-- CreateIndex
CREATE INDEX "idx_alocacoes_maquinas_colaborador" ON "alocacoes_maquinas"("colaborador_id");

-- CreateIndex
CREATE INDEX "idx_alocacoes_maquinas_maquina" ON "alocacoes_maquinas"("maquina_id");

-- CreateIndex
CREATE INDEX "idx_alocacoes_notebooks_colaborador" ON "alocacoes_notebooks"("colaborador_id");

-- CreateIndex
CREATE INDEX "idx_alocacoes_aparelhos_colaborador" ON "alocacoes_aparelhos"("colaborador_id");

-- CreateIndex
CREATE INDEX "idx_alocacoes_ramais_colaborador" ON "alocacoes_ramais"("colaborador_id");

-- CreateIndex
CREATE INDEX "idx_audit_log_tabela" ON "audit_log"("tabela");

-- CreateIndex
CREATE INDEX "idx_audit_log_registro_id" ON "audit_log"("registro_id");

-- CreateIndex
CREATE INDEX "idx_audit_log_created_at" ON "audit_log"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_emprestado_colaborador_id_fkey" FOREIGN KEY ("emprestado_colaborador_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_emprestado_setor_id_fkey" FOREIGN KEY ("emprestado_setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aparelhos" ADD CONSTRAINT "aparelhos_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "impressoras" ADD CONSTRAINT "impressoras_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ramais" ADD CONSTRAINT "ramais_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "racks" ADD CONSTRAINT "racks_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alocacoes_maquinas" ADD CONSTRAINT "alocacoes_maquinas_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alocacoes_maquinas" ADD CONSTRAINT "alocacoes_maquinas_maquina_id_fkey" FOREIGN KEY ("maquina_id") REFERENCES "maquinas"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alocacoes_notebooks" ADD CONSTRAINT "alocacoes_notebooks_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alocacoes_notebooks" ADD CONSTRAINT "alocacoes_notebooks_notebook_id_fkey" FOREIGN KEY ("notebook_id") REFERENCES "notebooks"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alocacoes_aparelhos" ADD CONSTRAINT "alocacoes_aparelhos_aparelho_id_fkey" FOREIGN KEY ("aparelho_id") REFERENCES "aparelhos"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alocacoes_aparelhos" ADD CONSTRAINT "alocacoes_aparelhos_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alocacoes_ramais" ADD CONSTRAINT "alocacoes_ramais_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alocacoes_ramais" ADD CONSTRAINT "alocacoes_ramais_ramal_id_fkey" FOREIGN KEY ("ramal_id") REFERENCES "ramais"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

