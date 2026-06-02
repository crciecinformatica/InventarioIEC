import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadArquivo } from '@/lib/supabase-storage'
import { registrarAuditoria } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

const MAX_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED  = [
  'application/pdf',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]

export async function POST(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id: pasta_id } = await params
    const userId   = (session.user as any).id as string
    const userName = session.user?.name ?? 'Usuário'

    const pasta = await prisma.forum_pastas.findUnique({ where: { id: pasta_id } })
    if (!pasta) return NextResponse.json({ error: 'Pasta não encontrada' }, { status: 404 })

    const formData = await request.formData()
    const file     = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Arquivo muito grande (máx 20MB)' }, { status: 400 })
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })

    const buffer   = Buffer.from(await file.arrayBuffer())
    const { path, url } = await uploadArquivo(buffer, file.name, file.type, pasta_id)

    const arquivo = await prisma.forum_arquivos.create({
      data: {
        pasta_id,
        tipo_arquivo:   file.type,
        nome_original:  file.name,
        nome_armazenado: path,
        tamanho_bytes:  file.size,
        url_publica:    url,
        usuario_id:     userId,
      },
    })

    await registrarAuditoria({
      tabela: 'forum_arquivos',
      registro_id: arquivo.id,
      acao: 'CREATE',
      descricao: `Arquivo "${arquivo.nome_original}" enviado para a pasta "${pasta.nome}"`,
      dados_novos: arquivo as any,
      usuario_id: userId,
      usuario_nome: userName,
    })

    return NextResponse.json(arquivo, { status: 201 })
  } catch (err) {
    console.error('[POST /api/forum/pastas/[id]/upload]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
