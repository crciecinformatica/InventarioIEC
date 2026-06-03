import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const rootPastas = await prisma.forum_pastas.findMany({
      where: {
        OR: [
          { nome: { contains: 'tutorial', mode: 'insensitive' } },
          { nome: { contains: 'tutoriais', mode: 'insensitive' } },
        ],
      },
      orderBy: { nome: 'asc' },
      include: {
        _count: { select: { arquivos: true, filhos: true } },
      },
    })

    const allPastas = await prisma.forum_pastas.findMany({
      select: { id: true, parent_id: true },
    })
    const childMap = allPastas.reduce((map, pasta) => {
      if (!pasta.parent_id) return map
      const list = map.get(pasta.parent_id) ?? []
      list.push(pasta.id)
      map.set(pasta.parent_id, list)
      return map
    }, new Map<string, string[]>())

    function collectDescendants(rootId: string) {
      const ids = new Set([rootId])
      const queue = [rootId]
      while (queue.length > 0) {
        const current = queue.shift()!
        for (const childId of childMap.get(current) ?? []) {
          if (ids.has(childId)) continue
          ids.add(childId)
          queue.push(childId)
        }
      }
      return Array.from(ids)
    }

    const rootToIds = new Map(rootPastas.map(pasta => [pasta.id, collectDescendants(pasta.id)]))
    const pastaIds = Array.from(new Set(Array.from(rootToIds.values()).flat()))
    const [arquivos, arquivosGroups] = pastaIds.length > 0
      ? await Promise.all([
          prisma.forum_arquivos.findMany({
            where: { pasta_id: { in: pastaIds } },
            orderBy: { created_at: 'desc' },
            take: 24,
          }),
          prisma.forum_arquivos.groupBy({
            by: ['pasta_id'],
            where: { pasta_id: { in: pastaIds } },
            _count: { id: true },
          }),
        ])
      : [[], []]
    const arquivosPorPasta = arquivosGroups.reduce((map, item) => {
      if (!item.pasta_id) return map
      map.set(item.pasta_id, item._count.id)
      return map
    }, new Map<string, number>())
    const pastas = rootPastas.map(pasta => {
      const ids = rootToIds.get(pasta.id) ?? [pasta.id]
      const totalArquivos = ids.reduce((sum, id) => sum + (arquivosPorPasta.get(id) ?? 0), 0)
      return { ...pasta, totalArquivos }
    })

    return NextResponse.json({ pastas, arquivos })
  } catch (err) {
    console.error('[GET /api/forum/tutorial-assets]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
