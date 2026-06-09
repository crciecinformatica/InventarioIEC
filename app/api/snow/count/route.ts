import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const count = await prisma.solicitacoes_snow.count({
      where: {
        itens: {
          some: {
            status: 'atendida',
            planner_status: { not: 'concluido' },
          },
        },
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('[GET /api/snow/count]', error)
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}
