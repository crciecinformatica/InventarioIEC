import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria } from '@/lib/audit'
import { FORUM_ETIQUETAS } from '@/lib/forum'

export const runtime = 'nodejs'

function isForumEtiqueta(value: string) {
  return FORUM_ETIQUETAS.includes(value as any)
}

async function getPipelinePastas(etiqueta: string) {
  const vinculos = await prisma.forum_pipeline_pastas.findMany({
    where: { etiqueta },
    orderBy: { created_at: 'asc' },
    include: {
      pasta: {
        include: {
          _count: { select: { arquivos: true, filhos: true } },
        },
      },
    },
  })

  if (vinculos.length === 0) return []

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
    const ids = new Set<string>([rootId])
    const stack = [...(childMap.get(rootId) ?? [])]
    while (stack.length > 0) {
      const id = stack.pop()
      if (!id || ids.has(id)) continue
      ids.add(id)
      stack.push(...(childMap.get(id) ?? []))
    }
    return Array.from(ids)
  }

  const rootToIds = new Map(vinculos.map(vinculo => [vinculo.pasta_id, collectDescendants(vinculo.pasta_id)]))
  const pastaIds = Array.from(new Set(Array.from(rootToIds.values()).flat()))
  const arquivos = await prisma.forum_arquivos.findMany({
    where: { pasta_id: { in: pastaIds } },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      pasta_id: true,
      nome_original: true,
      tipo_arquivo: true,
      tamanho_bytes: true,
      url_publica: true,
    },
  })

  return vinculos.map(vinculo => {
    const ids = rootToIds.get(vinculo.pasta_id) ?? [vinculo.pasta_id]
    const arquivosDaPasta = arquivos.filter(arquivo => arquivo.pasta_id && ids.includes(arquivo.pasta_id))
    return {
      ...vinculo,
      pasta: {
        ...vinculo.pasta,
        totalArquivos: arquivosDaPasta.length,
        arquivos: arquivosDaPasta.slice(0, 8),
      },
    }
  })
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const etiqueta = searchParams.get('etiqueta') || ''
    if (!isForumEtiqueta(etiqueta)) return NextResponse.json({ error: 'Pipeline inválido' }, { status: 400 })

    const vinculos = await getPipelinePastas(etiqueta)

    return NextResponse.json({ data: vinculos })
  } catch (err) {
    console.error('[GET /api/forum/pipeline-pastas]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const userId = (session.user as any).id as string
    const userName = session.user?.name ?? 'Usuário'
    const { etiqueta, pasta_ids = [] } = await request.json()
    if (typeof etiqueta !== 'string' || !isForumEtiqueta(etiqueta)) {
      return NextResponse.json({ error: 'Pipeline inválido' }, { status: 400 })
    }

    const pastaIds: string[] = Array.from(new Set(
      Array.isArray(pasta_ids)
        ? pasta_ids.filter((id: unknown): id is string => typeof id === 'string' && Boolean(id))
        : [],
    ))

    const anteriores = await prisma.forum_pipeline_pastas.findMany({
      where: { etiqueta },
      include: { pasta: true },
    })

    await prisma.forum_pipeline_pastas.deleteMany({ where: { etiqueta } })
    if (pastaIds.length > 0) {
      await prisma.forum_pipeline_pastas.createMany({
        data: pastaIds.map(pasta_id => ({ etiqueta, pasta_id })),
        skipDuplicates: true,
      })
    }

    const atuais = await getPipelinePastas(etiqueta)

    await registrarAuditoria({
      tabela: 'forum_pipeline_pastas',
      registro_id: etiqueta,
      acao: 'UPDATE',
      descricao: `Pastas do pipeline "${etiqueta}" atualizadas`,
      dados_anteriores: anteriores as any,
      dados_novos: atuais as any,
      usuario_id: userId,
      usuario_nome: userName,
    })

    return NextResponse.json({ data: atuais })
  } catch (err) {
    console.error('[POST /api/forum/pipeline-pastas]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
