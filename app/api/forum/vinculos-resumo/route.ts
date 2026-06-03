import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tipoItem = searchParams.get('tipo_item') || ''
  const ids = (searchParams.get('ids') || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
  const labels = (searchParams.get('labels') || '')
    .split(',')
    .map(label => label.trim())
    .filter(Boolean)

  if (!tipoItem || (ids.length === 0 && labels.length === 0)) return NextResponse.json({ data: {} })

  const now = new Date()
  const itemFilters = [
    ...(ids.length > 0 ? [{ item_id: { in: ids } }] : []),
    ...(labels.length > 0 ? [{ item_label: { in: labels } }] : []),
  ]
  const vinculos = await prisma.forum_vinculos.findMany({
    where: {
      tipo_item: tipoItem,
      AND: [
        { OR: itemFilters },
        {
          OR: [
            { topico_id: { not: null } },
            {
              comentario_id: { not: null },
              comentario: {
                OR: [
                  { tipo: 'permanente' },
                  { tipo: 'temporario', expira_em: { gt: now } },
                ],
              },
            },
          ],
        },
      ],
    },
    include: {
      topico: {
        include: {
          etiquetas: true,
          _count: { select: { comentarios: true } },
        },
      },
      comentario: {
        include: {
          topico: {
            include: {
              etiquetas: true,
              _count: { select: { comentarios: true } },
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  })

  const data: Record<string, {
    count: number
    items: Array<{
      id: string
      topico_id: string
      topico_titulo: string
      autor_nome: string
      conteudo: string
      origem: 'topico' | 'comentario'
      etiquetas: string[]
      created_at: Date | null
      comentarios_count: number
    }>
  }> = {}

  for (const vinculo of vinculos) {
    const topico = vinculo.topico ?? vinculo.comentario?.topico
    if (!topico) continue

    const keys = new Set<string>([vinculo.item_id])
    if (vinculo.item_label && labels.includes(vinculo.item_label)) keys.add(vinculo.item_label)

    for (const key of keys) {
      const bucket = data[key] ?? { count: 0, items: [] }
      bucket.count += 1
      if (bucket.items.length < 8) {
        bucket.items.push({
          id: vinculo.comentario?.id ?? topico.id,
          topico_id: topico.id,
          topico_titulo: topico.titulo,
          autor_nome: vinculo.comentario?.autor_nome ?? topico.autor_nome,
          conteudo: vinculo.comentario?.conteudo ?? topico.conteudo,
          origem: vinculo.comentario ? 'comentario' : 'topico',
          etiquetas: topico.etiquetas.map(item => item.etiqueta),
          created_at: vinculo.comentario?.created_at ?? topico.created_at,
          comentarios_count: topico._count?.comentarios ?? 0,
        })
      }
      data[key] = bucket
    }
  }

  return NextResponse.json({ data })
}
