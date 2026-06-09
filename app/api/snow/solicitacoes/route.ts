import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TIPOS_RELATORIO_SNOW } from '@/lib/snow/types'

export const runtime = 'nodejs'

const STATUS_PROCESSAMENTO = new Set(['processado', 'erro_processamento'])

function parseDateParam(value: string | null, endOfDay = false) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  if (endOfDay) date.setHours(23, 59, 59, 999)
  return date
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))
    const tipo = searchParams.get('tipo') || ''
    const status = searchParams.get('status') || ''
    const q = (searchParams.get('q') || '').trim()
    const inicio = parseDateParam(searchParams.get('inicio'))
    const fim = parseDateParam(searchParams.get('fim'), true)

    const where: any = {}
    if ((TIPOS_RELATORIO_SNOW as readonly string[]).includes(tipo)) where.tipo_arquivo = tipo
    if (STATUS_PROCESSAMENTO.has(status)) where.status_processamento = status
    if (inicio || fim) {
      where.criado_em = {
        ...(inicio ? { gte: inicio } : {}),
        ...(fim ? { lte: fim } : {}),
      }
    }
    if (q) {
      where.OR = [
        { nome_arquivo: { contains: q, mode: 'insensitive' } },
        { origem_email: { contains: q, mode: 'insensitive' } },
        { assunto_email: { contains: q, mode: 'insensitive' } },
        { itens: { some: { ip: { contains: q, mode: 'insensitive' } } } },
        { itens: { some: { hostname: { contains: q, mode: 'insensitive' } } } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.solicitacoes_snow.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { criado_em: 'desc' },
      }),
      prisma.solicitacoes_snow.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/snow/solicitacoes]', error)
    return NextResponse.json({ error: 'Erro interno', data: [], total: 0, page: 1, totalPages: 1 }, { status: 500 })
  }
}
