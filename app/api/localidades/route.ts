import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim()
    const ativo = searchParams.get('ativo') || ''

    const where: Prisma.localidadesWhereInput = {}
    if (search) where.nome = { contains: search, mode: 'insensitive' }
    if (ativo !== '') where.ativo = ativo === 'true'

    const data = await prisma.localidades.findMany({
      where,
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        ativo: true,
        _count: {
          select: {
            colaboradores: true,
            maquinas: true,
            notebooks: true,
            aparelhos: true,
            impressoras: true,
            ramais: true,
            racks: true,
          },
        },
      },
    })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/localidades]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
