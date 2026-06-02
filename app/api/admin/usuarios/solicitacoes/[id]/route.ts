import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isPrivilegedProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAuditSession, registrarAuditoria } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

async function getPrivilegedSession() {
  const session = await getServerSession(authOptions)
  if (!session || !isPrivilegedProfile((session.user as any).perfil)) return null
  return session
}

export async function PATCH(request: Request, { params }: Props) {
  const session = await getPrivilegedSession()
  if (!session) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params
  const { acao, observacao } = await request.json()
  if (acao !== 'aprovar' && acao !== 'rejeitar') {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }

  const actor = session.user as any
  const { usuario_id, usuario_nome } = await getAuditSession()

  try {
    if (acao === 'aprovar') {
      const result = await prisma.$transaction(async tx => {
        const solicitacao = await tx.solicitacoes_usuarios.findUnique({ where: { id } })
        if (!solicitacao) throw new Error('NOT_FOUND')
        if (solicitacao.status !== 'pendente' && solicitacao.status !== 'revisao') throw new Error('NOT_PENDING')

        const existente = await tx.usuarios.findUnique({
          where: { email: solicitacao.email },
          select: { id: true },
        })
        if (existente) throw new Error('EMAIL_EXISTS')
        const codigoExistente = await tx.usuarios.findFirst({
          where: { codigo_pessoa: { equals: solicitacao.codigo_pessoa, mode: 'insensitive' } },
          select: { id: true },
        })
        if (codigoExistente) throw new Error('CODE_EXISTS')

        const usuario = await tx.usuarios.create({
          data: {
            nome: solicitacao.nome,
            codigo_pessoa: solicitacao.codigo_pessoa,
            email: solicitacao.email,
            senha_hash: solicitacao.senha_hash,
            perfil: 'viewer',
            ativo: true,
          },
          select: { id: true, nome: true, codigo_pessoa: true, email: true, perfil: true, ativo: true, created_at: true },
        })

        const updated = await tx.solicitacoes_usuarios.update({
          where: { id },
          data: {
            status: 'aprovada',
            usuario_id: usuario.id,
            aprovado_por_id: actor.id ?? null,
            aprovado_por: actor.name ?? null,
            aprovado_em: new Date(),
            observacao: observacao || null,
            updated_at: new Date(),
          },
          select: {
            id: true,
            nome: true,
            codigo_pessoa: true,
            email: true,
            status: true,
            observacao: true,
            usuario_id: true,
            aprovado_por: true,
            aprovado_em: true,
            created_at: true,
            updated_at: true,
          },
        })

        return { solicitacao, updated, usuario }
      })

      await registrarAuditoria({
        tabela: 'solicitacoes_usuarios',
        registro_id: id,
        acao: 'APROVAR',
        descricao: `Solicitação de usuário "${result.updated.email}" aprovada`,
        dados_anteriores: sanitizeSolicitacao(result.solicitacao),
        dados_novos: result.updated,
        usuario_id,
        usuario_nome,
      })
      await registrarAuditoria({
        tabela: 'usuarios',
        registro_id: result.usuario.id,
        acao: 'CREATE',
        descricao: `Usuário "${result.usuario.email}" criado por aprovação de solicitação`,
        dados_novos: result.usuario,
        usuario_id,
        usuario_nome,
      })

      return NextResponse.json(result.updated)
    }

    const result = await prisma.$transaction(async tx => {
      const solicitacao = await tx.solicitacoes_usuarios.findUnique({ where: { id } })
      if (!solicitacao) throw new Error('NOT_FOUND')
      if (solicitacao.status !== 'pendente' && solicitacao.status !== 'revisao') throw new Error('NOT_PENDING')

      const updated = await tx.solicitacoes_usuarios.update({
        where: { id },
        data: {
          status: 'rejeitada',
          rejeitado_por_id: actor.id ?? null,
          rejeitado_por: actor.name ?? null,
          rejeitado_em: new Date(),
          observacao: observacao || null,
          updated_at: new Date(),
        },
        select: {
          id: true,
          nome: true,
          codigo_pessoa: true,
          email: true,
          status: true,
          observacao: true,
          rejeitado_por: true,
          rejeitado_em: true,
          created_at: true,
          updated_at: true,
        },
      })

      return { solicitacao, updated }
    })

    await registrarAuditoria({
      tabela: 'solicitacoes_usuarios',
      registro_id: id,
      acao: 'REJEITAR',
      descricao: `Solicitação de usuário "${result.updated.email}" rejeitada`,
      dados_anteriores: sanitizeSolicitacao(result.solicitacao),
      dados_novos: result.updated,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(result.updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
    if (message === 'NOT_PENDING') return NextResponse.json({ error: 'Solicitação já processada' }, { status: 409 })
    if (message === 'EMAIL_EXISTS') return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    if (message === 'CODE_EXISTS') return NextResponse.json({ error: 'Código de pessoa já cadastrado. Revise o usuário existente antes de aprovar.' }, { status: 409 })
    console.error('[PATCH /api/admin/usuarios/solicitacoes/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function sanitizeSolicitacao(solicitacao: any) {
  const { senha_hash: _senha_hash, ...safe } = solicitacao
  return safe
}
