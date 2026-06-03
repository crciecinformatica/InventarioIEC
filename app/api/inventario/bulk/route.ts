import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ForumTipoItem } from '@/lib/forum'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo') as ForumTipoItem | null
  const setorId = searchParams.get('setor_id') || ''
  const localidadeId = searchParams.get('localidade_id') || ''
  if (!tipo) return NextResponse.json({ results: [] })
  const scopeWhere = {
    ...(setorId ? { setor_id: setorId } : {}),
    ...(localidadeId ? { localidade_id: localidadeId } : {}),
  }

  try {
    switch (tipo) {
      case 'maquinas': {
        const items = await prisma.maquinas.findMany({
          where: scopeWhere,
          select: { id: true, nome_host: true, identificador: true, endereco_ip: true, fabricante: true, modelo: true, setor_rel: { select: { nome: true } } },
          orderBy: [{ endereco_ip: 'asc' }],
          take: 5000,
        })
        return NextResponse.json({ results: items.map(i => ({
          id: i.id,
          label: i.endereco_ip || i.nome_host || i.identificador || i.id,
          sub: [i.nome_host, i.fabricante, i.modelo].filter(Boolean).join(' · '),
          meta: i.setor_rel?.nome || '',
        })) })
      }
      case 'notebooks': {
        const items = await prisma.notebooks.findMany({
          where: scopeWhere,
          select: { id: true, modelo: true, fabricante: true, numero_patrimonio: true, setor_rel: { select: { nome: true } } },
          orderBy: [{ numero_patrimonio: 'asc' }],
          take: 5000,
        })
        return NextResponse.json({ results: items.map(i => ({
          id: i.id,
          label: i.numero_patrimonio || i.modelo || i.id,
          sub: [i.fabricante, i.modelo].filter(Boolean).join(' '),
          meta: i.setor_rel?.nome || '',
        })) })
      }
      case 'aparelhos': {
        const items = await prisma.aparelhos.findMany({
          where: scopeWhere,
          select: { id: true, modelo: true, endereco_ip: true, setor_rel: { select: { nome: true } } },
          orderBy: [{ modelo: 'asc' }],
          take: 5000,
        })
        return NextResponse.json({ results: items.map(i => ({
          id: i.id,
          label: i.modelo || i.id,
          sub: i.endereco_ip || '',
          meta: i.setor_rel?.nome || '',
        })) })
      }
      case 'ramais': {
        const items = await prisma.ramais.findMany({
          where: scopeWhere,
          select: { id: true, numero_ramal: true, prefixo_telefonico: true, setor_rel: { select: { nome: true } } },
          orderBy: [{ numero_ramal: 'asc' }],
          take: 5000,
        })
        return NextResponse.json({ results: items.map(i => ({
          id: i.id,
          label: i.numero_ramal != null ? `Ramal ${i.numero_ramal}` : i.id,
          sub: i.setor_rel?.nome || '',
          meta: i.prefixo_telefonico || '',
        })) })
      }
      case 'impressoras': {
        const items = await prisma.impressoras.findMany({
          where: scopeWhere,
          select: { id: true, nome_host: true, modelo: true, fabricante: true, endereco_ip: true, setor_rel: { select: { nome: true } } },
          orderBy: [{ endereco_ip: 'asc' }],
          take: 5000,
        })
        return NextResponse.json({ results: items.map(i => ({
          id: i.id,
          label: i.endereco_ip || i.nome_host || i.modelo || i.id,
          sub: [i.nome_host, i.fabricante, i.modelo].filter(Boolean).join(' · '),
          meta: i.setor_rel?.nome || '',
        })) })
      }
      case 'racks': {
        const items = await prisma.racks.findMany({
          where: scopeWhere,
          select: { id: true, nome_switch: true, marca_switch: true, localizacao: true, numero_patrimonio: true, setor_rel: { select: { nome: true } } },
          orderBy: [{ nome_switch: 'asc' }],
          take: 5000,
        })
        return NextResponse.json({ results: items.map(i => ({
          id: i.id,
          label: i.nome_switch || i.numero_patrimonio || i.id,
          sub: [i.marca_switch, i.localizacao].filter(Boolean).join(' · '),
          meta: i.setor_rel?.nome || '',
        })) })
      }
      default:
        return NextResponse.json({ results: [] })
    }
  } catch (err) {
    console.error('[GET /api/inventario/bulk]', err)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
