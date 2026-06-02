import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria } from '@/lib/audit'

export const runtime = 'nodejs'

const schema = z.object({
  nome: z.string().trim().min(2),
  codigo_pessoa: z.string().trim().min(1),
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  senha: z.string().min(6),
})

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { nome, codigo_pessoa, email, senha } = parsed.data

    const [usuarioExistente, usuarioCodigoExistente, solicitacaoPendente] = await Promise.all([
      prisma.usuarios.findUnique({ where: { email }, select: { id: true } }),
      prisma.usuarios.findFirst({
        where: { codigo_pessoa: { equals: codigo_pessoa, mode: 'insensitive' } },
        select: { id: true, nome: true, email: true },
      }),
      prisma.solicitacoes_usuarios.findFirst({
        where: {
          status: { in: ['pendente', 'revisao'] },
          OR: [
            { email: { equals: email, mode: 'insensitive' } },
            { codigo_pessoa: { equals: codigo_pessoa, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      }),
    ])

    if (usuarioExistente) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }
    if (solicitacaoPendente) {
      return NextResponse.json({ error: 'Já existe uma solicitação pendente ou em revisão para estes dados' }, { status: 409 })
    }

    const senha_hash = await bcrypt.hash(senha, 10)
    if (usuarioCodigoExistente) {
      const observacao = `Código de pessoa ${codigo_pessoa} já está vinculado ao usuário ${usuarioCodigoExistente.nome} (${usuarioCodigoExistente.email}). Solicitação enviada para revisão administrativa.`
      const solicitacao = await prisma.solicitacoes_usuarios.create({
        data: { nome, codigo_pessoa, email, senha_hash, status: 'revisao', observacao },
        select: {
          id: true,
          nome: true,
          codigo_pessoa: true,
          email: true,
          status: true,
          observacao: true,
          created_at: true,
        },
      })

      await registrarAuditoria({
        tabela: 'solicitacoes_usuarios',
        registro_id: solicitacao.id,
        acao: 'CREATE',
        descricao: `Solicitação de revisão para código de pessoa "${codigo_pessoa}" criada`,
        dados_novos: solicitacao,
        usuario_nome: 'Solicitante externo',
      })

      return NextResponse.json(
        {
          ...solicitacao,
          message: 'Já existe um usuário com esse código de pessoa. Contacte o administrador; enviamos sua solicitação para revisão.',
        },
        { status: 202 },
      )
    }

    const solicitacao = await prisma.solicitacoes_usuarios.create({
      data: { nome, codigo_pessoa, email, senha_hash, status: 'pendente' },
      select: {
        id: true,
        nome: true,
        codigo_pessoa: true,
        email: true,
        status: true,
        created_at: true,
      },
    })

    await registrarAuditoria({
      tabela: 'solicitacoes_usuarios',
      registro_id: solicitacao.id,
      acao: 'CREATE',
      descricao: `Solicitação de usuário para "${solicitacao.email}" criada`,
      dados_novos: solicitacao,
      usuario_nome: 'Solicitante externo',
    })

    return NextResponse.json(solicitacao, { status: 201 })
  } catch (err) {
    if (isMissingSolicitacoesUsuariosTable(err)) {
      return NextResponse.json(
        { error: 'Solicitações de acesso ainda não foram habilitadas no banco.' },
        { status: 503 },
      )
    }
    console.error('[POST /api/auth/solicitar-acesso]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function isMissingSolicitacoesUsuariosTable(err: unknown) {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2021'
  )
}
