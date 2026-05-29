import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteArquivo } from '@/lib/supabase-storage'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const { nome, descricao, cor } = await request.json()

    const pasta = await prisma.forum_pastas.update({
      where: { id },
      data: {
        nome:       nome?.trim(),
        descricao:  descricao || null,
        cor:        cor,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(pasta)
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const perfil = (session.user as any).perfil as string
    if (perfil !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

    const { id } = await params

    // Deletar todos os arquivos do storage recursivamente
    const arquivos = await prisma.forum_arquivos.findMany({
      where: { pasta_id: id },
      select: { nome_armazenado: true },
    })
    await Promise.all(arquivos.map(a => deleteArquivo(a.nome_armazenado)))

    await prisma.forum_pastas.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}