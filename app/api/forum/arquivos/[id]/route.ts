import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function DELETE(_: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const userId = (session.user as any).id as string
    const perfil = (session.user as any).perfil as string

    // Buscar o arquivo
    const arquivo = await prisma.forum_arquivos.findUnique({ where: { id } })
    if (!arquivo) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })

    // Verificar permissão: autor do arquivo ou admin
    const isAutor = arquivo.usuario_id === userId
    const isAdmin = perfil === 'admin'

    if (!isAutor && !isAdmin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Deletar do Supabase Storage
    const { error: deleteStorageError } = await supabase.storage
      .from('forum-arquivos')
      .remove([arquivo.nome_armazenado])

    if (deleteStorageError) {
      console.error('[DELETE STORAGE ERROR]', deleteStorageError)
      // Continuar mesmo se falhar no storage (a referência será removida do DB)
    }

    // Deletar do banco de dados
    await prisma.forum_arquivos.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/forum/arquivos/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
