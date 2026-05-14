import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession, descricaoDiff } from '@/lib/audit'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const { usuario_id, usuario_nome } = await getAuditSession()
    const { nome, descricao, ativo } = await request.json()

    const anterior = await prisma.setores.findUnique({ where: { id } })
    if (!anterior) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const data: Prisma.setoresUncheckedUpdateInput = {}
    if (nome !== undefined)      data.nome      = nome.trim()
    if (descricao !== undefined) data.descricao = descricao || null
    if (ativo !== undefined)     data.ativo     = ativo

    const item = await prisma.setores.update({ where: { id }, data })

    await registrarAuditoria({
      tabela: 'setores', registro_id: id, acao: 'UPDATE',
      descricao: descricaoDiff(anterior, data),
      dados_anteriores: anterior,
      dados_novos: data,
      usuario_id, usuario_nome,
    })

    return NextResponse.json(item)
  } catch (err) {
    console.error('[PUT /api/setores/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const { usuario_id, usuario_nome } = await getAuditSession()

    // Soft delete — desativa em vez de deletar para preservar histórico
    const item = await prisma.setores.update({
      where: { id },
      data: { ativo: false },
    })

    await registrarAuditoria({
      tabela: 'setores', registro_id: id, acao: 'DELETE',
      descricao: `Setor "${item.nome}" desativado`,
      usuario_id, usuario_nome,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/setores/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
