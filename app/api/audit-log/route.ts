import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '30')
  const tabela = searchParams.get('tabela') || ''
  const acao = searchParams.get('acao') || ''
  const usuario = searchParams.get('usuario') || ''
  const usuario_id = searchParams.get('usuario_id') || ''
  const edicoes = searchParams.get('edicoes') === '1'
  const registro_id = searchParams.get('registro_id') || ''
  const sortBy  = searchParams.get('sort') || 'created_at'
  const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'

  const where: any = {}
  if (tabela) where.tabela = tabela
  if (edicoes) where.acao = { in: ['UPDATE', 'EDITAR_ALOCACAO'] }
  else if (acao) where.acao = acao
  if (usuario_id) where.usuario_id = usuario_id
  if (usuario && !usuario_id) {
    const matchingUsers = await prisma.usuarios.findMany({
      where: {
        OR: [
          { nome: { contains: usuario, mode: 'insensitive' } },
          { email: { contains: usuario, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
      take: 100,
    })
    where.OR = [
      { usuario_nome: { contains: usuario, mode: 'insensitive' } },
      ...(matchingUsers.length > 0 ? [{ usuario_id: { in: matchingUsers.map(user => user.id) } }] : []),
    ]
  }
  if (registro_id) where.registro_id = registro_id

  const [data, total] = await Promise.all([
    prisma.audit_log.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy === 'created_at' ? 'created_at' : 'created_at']: sortDir },
    }),
    prisma.audit_log.count({ where }),
  ])

  const userIds = Array.from(new Set(data.map(item => item.usuario_id).filter(Boolean))) as string[]
  const usuarios = userIds.length > 0
    ? await prisma.usuarios.findMany({
        where: { id: { in: userIds } },
        select: { id: true, nome: true },
      })
    : []
  const nomesAtuais = new Map(usuarios.map(user => [user.id, user.nome]))
  const normalizedData = data.map(item => ({
    ...item,
    usuario_nome_original: item.usuario_nome,
    usuario_nome: item.usuario_id ? (nomesAtuais.get(item.usuario_id) ?? item.usuario_nome) : item.usuario_nome,
  }))

  return NextResponse.json({ data: normalizedData, total, page, totalPages: Math.ceil(total / limit) })
}
