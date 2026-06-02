import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ results: [] }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()

    if (q.length < 2) return NextResponse.json({ results: [] })

    // Mesmo padrão da rota /api/ramais que funciona
    const numQ = parseInt(q, 10)
    const isValidNum = !isNaN(numQ)

    const results = await Promise.allSettled([
      // Colaboradores
      prisma.colaboradores.findMany({
        where: {
          OR: [
            { nome: { contains: q, mode: 'insensitive' } },
            ...(isValidNum ? [{ codigo: numQ }] : []),
          ],
        },
        select: {
          id: true, nome: true, status: true,
          setor_rel: { select: { nome: true } },
        },
        take: 5,
      }),

      // Máquinas
      prisma.maquinas.findMany({
        where: {
          OR: [
            { nome_host:    { contains: q, mode: 'insensitive' } },
            { identificador:{ contains: q, mode: 'insensitive' } },
            { fabricante:   { contains: q, mode: 'insensitive' } },
            { modelo:       { contains: q, mode: 'insensitive' } },
            { setor_rel: { nome: { contains: q, mode: 'insensitive' } } },
            { endereco_ip:   { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true, nome_host: true, identificador: true,
          fabricante: true, modelo: true,
          setor_rel: { select: { nome: true } }, endereco_ip: true
        },
        take: 5,
      }),

      // Notebooks
      prisma.notebooks.findMany({
        where: {
          OR: [
            { modelo:           { contains: q, mode: 'insensitive' } },
            { numero_patrimonio:{ contains: q, mode: 'insensitive' } },
            { fabricante:       { contains: q, mode: 'insensitive' } },
            { setor_rel: { nome: { contains: q, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true, modelo: true, fabricante: true,
          numero_patrimonio: true,
          setor_rel: { select: { nome: true } },
        },
        take: 5,
      }),

      // Aparelhos
      prisma.aparelhos.findMany({
        where: {
          OR: [
            { modelo:      { contains: q, mode: 'insensitive' } },
            { endereco_ip: { contains: q, mode: 'insensitive' } },
            { endereco_mac:{ contains: q, mode: 'insensitive' } },
            { setor_rel: { nome: { contains: q, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true, modelo: true, endereco_ip: true,
          setor_rel: { select: { nome: true } },
        },
        take: 5,
      }),

      // Ramais — exatamente igual ao /api/ramais que funciona
      prisma.ramais.findMany({
        where: {
          OR: [
            { numero_ramal: { contains: q, mode: 'insensitive' } },
            { setor_rel: { nome: { contains: q, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true, numero_ramal: true,
          setor_rel: { select: { nome: true } },
        },
        take: 5,
      }),

      // Impressoras
      prisma.impressoras.findMany({
        where: {
          OR: [
            { modelo:    { contains: q, mode: 'insensitive' } },
            { localidade:{ contains: q, mode: 'insensitive' } },
            { fabricante:{ contains: q, mode: 'insensitive' } },
            { setor_rel: { nome: { contains: q, mode: 'insensitive' } } },
            { endereco_ip:   { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true, modelo: true, fabricante: true,
          localidade: true,
          setor_rel: { select: { nome: true } },
          endereco_ip: true,
        },
        take: 5,
      }),
    ])

    const [
      colaboradoresRes, maquinasRes, notebooksRes,
      aparelhosRes, ramaisRes, impressorasRes,
    ] = results

    // Log de erros parciais sem quebrar a resposta
    const names = ['colaboradores','maquinas','notebooks','aparelhos','ramais','impressoras']
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[search] ${names[i]} falhou:`, r.reason?.message ?? r.reason)
      }
    })

    const colaboradores = colaboradoresRes.status === 'fulfilled' ? colaboradoresRes.value : []
    const maquinas      = maquinasRes.status      === 'fulfilled' ? maquinasRes.value      : []
    const notebooks     = notebooksRes.status     === 'fulfilled' ? notebooksRes.value     : []
    const aparelhos     = aparelhosRes.status     === 'fulfilled' ? aparelhosRes.value     : []
    const ramais        = ramaisRes.status        === 'fulfilled' ? ramaisRes.value        : []
    const impressoras   = impressorasRes.status   === 'fulfilled' ? impressorasRes.value   : []

    const mapped = [
      ...colaboradores.map((c: any) => ({
        id: c.id,
        tipo: 'colaborador',
        label: c.nome,
        sub: c.setor_rel?.nome ?? '',
        meta: c.status ?? '',
        href: `/colaboradores?inspect=${c.id}`,
      })),
      ...maquinas.map((m: any) => ({
        id: m.id,
        tipo: 'maquina',
        label: m.endereco_ip || m.nome_host || m.identificador || '—',
        sub: [m.nome_host, m.fabricante, m.modelo].filter(Boolean).join(' · '),
        meta: m.setor_rel?.nome ?? '',
        href: `/maquinas?inspect=${m.id}`,
      })),
      ...notebooks.map((n: any) => ({
        id: n.id,
        tipo: 'notebook',
        label: n.numero_patrimonio || n.modelo || '—',
        sub: [n.fabricante, n.modelo].filter(Boolean).join(' '),
        meta: n.setor_rel?.nome ?? '',
        href: `/notebooks?inspect=${n.id}`,
      })),
      ...aparelhos.map((a: any) => ({
        id: a.id,
        tipo: 'aparelho',
        label: a.modelo || '—',
        sub: a.endereco_ip || '',
        meta: a.setor_rel?.nome ?? '',
        href: `/aparelhos?inspect=${a.id}`,
      })),
      ...ramais.map((r: any) => ({
        id: r.id,
        tipo: 'ramal',
        label: r.numero_ramal != null ? `Ramal ${r.numero_ramal}` : '—',
        sub: r.setor_rel?.nome ?? '',
        meta: '',
        href: `/ramais?inspect=${r.id}`,
      })),
      ...impressoras.map((i: any) => ({
        id: i.id,
        tipo: 'impressora',
        label: i.modelo || '—',
        sub: [i.fabricante, i.localidade].filter(Boolean).join(' · '),
        meta: i.setor_rel?.nome ?? '',
        href: `/impressoras?inspect=${i.id}`,
      })),
    ]

    return NextResponse.json({ results: mapped })
  } catch (error) {
    console.error('[GET /api/search]', error instanceof Error ? error.message : error)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
