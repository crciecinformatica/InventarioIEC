import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSupabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { registrarAuditoria } from '@/lib/audit'

export const runtime = 'nodejs'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const userId = (session.user as any).id as string
    const userName = session.user?.name ?? 'Usuário'
    const formData = await request.formData()
    const file = formData.get('file') as File
    const topico_id = formData.get('topico_id') as string | null
    const comentario_id = formData.get('comentario_id') as string | null

    // Validação
    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    if (!topico_id && !comentario_id) {
      return NextResponse.json({ error: 'topico_id ou comentario_id é obrigatório' }, { status: 400 })
    }
    if (topico_id && comentario_id) {
      return NextResponse.json({ error: 'Envie apenas topico_id OU comentario_id, não ambos' }, { status: 400 })
    }

    // Validar tipo de arquivo
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido. Aceitos: JPEG, PNG, PDF` },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: 10MB` },
        { status: 400 }
      )
    }

    // Verifica se os IDs são temporários (gerados no frontend antes da criação)
    const isTempTopico = topico_id?.startsWith('temp-')
    const isTempComentario = comentario_id?.startsWith('temp-')

    // Verificar se o tópico/comentário existe APENAS se não for temporário
    if (topico_id && !isTempTopico) {
      const topico = await prisma.forum_topicos.findUnique({ where: { id: topico_id } })
      if (!topico) {
        return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 })
      }
    } else if (comentario_id && !isTempComentario) {
      const comentario = await prisma.forum_comentarios.findUnique({ where: { id: comentario_id } })
      if (!comentario) {
        return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 })
      }
    }

    // Gerar nomes para armazenamento
    const fileExtension = file.name.split('.').pop() || 'bin'
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    const parentId = topico_id || comentario_id
    const storagePath = `forum/${parentId}/${uniqueFileName}`
    const supabase = getSupabase()

    // Upload para Supabase Storage
    const buffer = await file.arrayBuffer()
    const { error: uploadError, data } = await supabase.storage
      .from('forum-arquivos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[UPLOAD ERROR]', uploadError)
      return NextResponse.json({ error: 'Erro ao fazer upload do arquivo no Storage' }, { status: 500 })
    }

    // Gerar URL pública
    const { data: publicUrl } = supabase.storage
      .from('forum-arquivos')
      .getPublicUrl(storagePath)

    // Criar registro no banco de dados.
    // Se for um ID temporário, passamos undefined para não quebrar a chave estrangeira do Prisma.
    // O endpoint de criação do tópico/comentário vai vincular este ID de arquivo depois.
    const arquivo = await prisma.forum_arquivos.create({
      data: {
        topico_id: topico_id && !isTempTopico ? topico_id : undefined,
        comentario_id: comentario_id && !isTempComentario ? comentario_id : undefined,
        usuario_id: userId,
        tipo_arquivo: file.type,
        nome_original: file.name,
        nome_armazenado: storagePath,
        tamanho_bytes: file.size,
        url_publica: publicUrl.publicUrl,
      },
    })

    await registrarAuditoria({
      tabela: 'forum_arquivos',
      registro_id: arquivo.id,
      acao: 'CREATE',
      descricao: `Arquivo "${arquivo.nome_original}" enviado ao fórum`,
      dados_novos: arquivo as any,
      usuario_id: userId,
      usuario_nome: userName,
    })

    return NextResponse.json(
      {
        id: arquivo.id,
        nome_original: arquivo.nome_original,
        tipo_arquivo: arquivo.tipo_arquivo,
        tamanho_bytes: arquivo.tamanho_bytes,
        url_publica: arquivo.url_publica,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/forum/upload]', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
