import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { isSnowIntegrationAuthorized } from '@/lib/snow/auth'
import { parseConcluirPayload } from '@/lib/snow/planner'
import { markSnowItemCompleted } from '@/lib/snow/repositories'
import { SnowProcessingError } from '@/lib/snow/types'

export const runtime = 'nodejs'

type Props = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Props) {
  if (!isSnowIntegrationAuthorized(request)) {
    return NextResponse.json({ error: 'Token de integração SNOW inválido' }, { status: 401 })
  }

  try {
    const { id } = await params
    const payload = parseConcluirPayload(await request.json().catch(() => ({})))
    const item = await markSnowItemCompleted({ id, ...payload })

    return NextResponse.json({
      id: item.id,
      planner_status: item.planner_status,
      planner_task_id: item.planner_task_id,
      atendente_nome: item.atendente_nome,
      atendente_codigo_pessoa: item.atendente_codigo_pessoa,
      assumido_em: item.assumido_em,
      concluido_em: item.concluido_em,
      conclusao_observacao: item.conclusao_observacao,
      planner_atualizado_em: item.planner_atualizado_em,
    })
  } catch (error) {
    if (error instanceof SnowProcessingError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Item SNOW não encontrado' }, { status: 404 })
    }

    console.error('[POST /api/snow/itens/[id]/concluir]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
