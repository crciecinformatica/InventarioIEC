import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { isSnowIntegrationAuthorized } from '@/lib/snow/auth'
import { parseCscPayload } from '@/lib/snow/planner'
import { registerSnowItemCsc } from '@/lib/snow/repositories'
import { SnowProcessingError } from '@/lib/snow/types'

export const runtime = 'nodejs'

type Props = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Props) {
  if (!isSnowIntegrationAuthorized(request)) {
    return NextResponse.json({ error: 'Token de integração SNOW inválido' }, { status: 401 })
  }

  try {
    const { id } = await params
    const payload = parseCscPayload(await request.json().catch(() => ({})))
    const item = await registerSnowItemCsc({ id, ...payload })

    return NextResponse.json({
      id: item.id,
      csc_numero: item.csc_numero,
      csc_criado_em: item.csc_criado_em,
      csc_atualizado_em: item.csc_atualizado_em,
      planner_status: item.planner_status,
      planner_task_id: item.planner_task_id,
      planner_atualizado_em: item.planner_atualizado_em,
    })
  } catch (error) {
    if (error instanceof SnowProcessingError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Item SNOW não encontrado' }, { status: 404 })
    }

    console.error('[POST /api/snow/itens/[id]/csc]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
