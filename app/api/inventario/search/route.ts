import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tipo  = searchParams.get('tipo')  || ''
  const query = searchParams.get('q')     || ''

  if (!tipo || !query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    switch (tipo) {
      case 'maquinas': {
        const items = await prisma.maquinas.findMany({
          where: {
            OR: [
              { nome_host:    { contains: query, mode: 'insensitive' } },
              { identificador:{ contains: query, mode: 'insensitive' } },
              { endereco_ip:  { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, nome_host: true, identificador: true, endereco_ip: true, fabricante: true, modelo: true, setor_rel: { select: { nome: true } } },
          take: 25,
        })
        return NextResponse.json({
          results: items.map(i => ({
            id: i.id,
            label: i.endereco_ip || i.nome_host || i.identificador || i.id,
            sub: [i.nome_host, i.fabricante, i.modelo].filter(Boolean).join(' · '),
            meta: i.setor_rel?.nome || '',
          })),
        })
      }

      case 'notebooks': {
        const items = await prisma.notebooks.findMany({
          where: {
            OR: [
              { modelo:           { contains: query, mode: 'insensitive' } },
              { numero_patrimonio:{ contains: query, mode: 'insensitive' } },
              { fabricante:       { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, modelo: true, fabricante: true, numero_patrimonio: true, setor_rel: { select: { nome: true } } },
          take: 25,
        })
        return NextResponse.json({
          results: items.map(i => ({
            id: i.id,
            label: i.numero_patrimonio || i.modelo || i.id,
            sub: [i.fabricante, i.modelo].filter(Boolean).join(' '),
            meta: i.setor_rel?.nome || '',
          })),
        })
      }

      case 'aparelhos': {
        const items = await prisma.aparelhos.findMany({
          where: {
            OR: [
              { modelo:      { contains: query, mode: 'insensitive' } },
              { endereco_ip: { contains: query, mode: 'insensitive' } },
              { endereco_mac:{ contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, modelo: true, endereco_ip: true, setor_rel: { select: { nome: true } } },
          take: 25,
        })
        return NextResponse.json({
          results: items.map(i => ({
            id: i.id,
            label: i.modelo || i.id,
            sub: i.endereco_ip || '',
            meta: i.setor_rel?.nome || '',
          })),
        })
      }

      case 'ramais': {
        const items = await prisma.ramais.findMany({
          where: {
            OR: [
              { numero_ramal: { contains: query, mode: 'insensitive' } },
              { setor_rel: { nome: { contains: query, mode: 'insensitive' } } },
            ],
          },
          select: { id: true, numero_ramal: true, prefixo_telefonico: true, setor_rel: { select: { nome: true } } },
          take: 25,
        })
        return NextResponse.json({
          results: items.map(i => ({
            id: i.id,
            label: i.numero_ramal != null ? `Ramal ${i.numero_ramal}` : i.id,
            sub: i.setor_rel?.nome || '',
            meta: i.prefixo_telefonico || '',
          })),
        })
      }

      case 'impressoras': {
        const items = await prisma.impressoras.findMany({
          where: {
            OR: [
              { nome_host: { contains: query, mode: 'insensitive' } },
              { modelo: { contains: query, mode: 'insensitive' } },
              { fabricante: { contains: query, mode: 'insensitive' } },
              { endereco_ip: { contains: query, mode: 'insensitive' } },
              { numero_serie: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, nome_host: true, modelo: true, fabricante: true, endereco_ip: true, setor_rel: { select: { nome: true } } },
          take: 25,
        })
        return NextResponse.json({
          results: items.map(i => ({
            id: i.id,
            label: i.endereco_ip || i.nome_host || i.modelo || i.id,
            sub: [i.nome_host, i.fabricante, i.modelo].filter(Boolean).join(' · '),
            meta: i.setor_rel?.nome || '',
          })),
        })
      }

      case 'racks': {
        const items = await prisma.racks.findMany({
          where: {
            OR: [
              { nome_switch: { contains: query, mode: 'insensitive' } },
              { marca_switch: { contains: query, mode: 'insensitive' } },
              { localizacao: { contains: query, mode: 'insensitive' } },
              { numero_patrimonio: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, nome_switch: true, marca_switch: true, localizacao: true, numero_patrimonio: true, setor_rel: { select: { nome: true } } },
          take: 25,
        })
        return NextResponse.json({
          results: items.map(i => ({
            id: i.id,
            label: i.nome_switch || i.numero_patrimonio || i.id,
            sub: [i.marca_switch, i.localizacao].filter(Boolean).join(' · '),
            meta: i.setor_rel?.nome || '',
          })),
        })
      }

      default:
        return NextResponse.json({ results: [] })
    }
  } catch (err) {
    console.error('[GET /api/inventario/search]', err)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
