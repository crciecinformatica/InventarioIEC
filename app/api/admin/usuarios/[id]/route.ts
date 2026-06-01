import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isPrivilegedProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { descricaoDiff, getAuditSession, registrarAuditoria } from '@/lib/audit'

export const runtime = 'nodejs'

type Props = { params: Promise<{ id: string }> }

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) return false
  return isPrivilegedProfile((session.user as any).perfil)
}

async function getPrivilegedSession() {
  const session = await getServerSession(authOptions)
  if (!session || !isPrivilegedProfile((session.user as any).perfil)) return null
  return session
}

export async function PUT(request: Request, { params }: Props) {
  const session = await getPrivilegedSession()
  if (!session) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { nome, codigo_pessoa, email, perfil, ativo, senha } = body
  const anterior = await prisma.usuarios.findUnique({
    where: { id },
    select: { id: true, nome: true, codigo_pessoa: true, email: true, perfil: true, ativo: true, created_at: true },
  })
  if (!anterior) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  if (email && email !== anterior.email) {
    const existe = await prisma.usuarios.findUnique({ where: { email }, select: { id: true } })
    if (existe && existe.id !== id) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }
  }
  if (codigo_pessoa && codigo_pessoa !== anterior.codigo_pessoa) {
    const existeCodigo = await prisma.usuarios.findFirst({
      where: { codigo_pessoa: { equals: codigo_pessoa, mode: 'insensitive' } },
      select: { id: true },
    })
    if (existeCodigo && existeCodigo.id !== id) {
      return NextResponse.json({ error: 'Código de pessoa já cadastrado' }, { status: 409 })
    }
  }

  const canEditRole = (session.user as any).perfil === 'dev'
  const data: any = { nome, codigo_pessoa: codigo_pessoa || null, email, perfil: canEditRole ? perfil : anterior.perfil, ativo }
  if (senha && senha.length > 0) {
    data.senha_hash = await bcrypt.hash(senha, 10)
  }

  const usuario = await prisma.usuarios.update({
    where: { id },
    data,
    select: {
      id: true,
      nome: true,
      codigo_pessoa: true,
      email: true,
      perfil: true,
      ativo: true,
      created_at: true,
    },
  })
  const { usuario_id, usuario_nome } = await getAuditSession()
  await registrarAuditoria({
    tabela: 'usuarios',
    registro_id: usuario.id,
    acao: 'UPDATE',
    descricao: descricaoDiff(anterior as any, usuario as any),
    dados_anteriores: anterior,
    dados_novos: usuario,
    usuario_id,
    usuario_nome,
  })

  return NextResponse.json(usuario)
}

export async function DELETE(_: Request, { params }: Props) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params
  const anterior = await prisma.usuarios.findUnique({
    where: { id },
    select: { id: true, nome: true, codigo_pessoa: true, email: true, perfil: true, ativo: true, created_at: true },
  })
  if (!anterior) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const usuario = await prisma.usuarios.update({
    where: { id },
    data: { ativo: false },
    select: { id: true, nome: true, codigo_pessoa: true, email: true, perfil: true, ativo: true, created_at: true },
  })
  const { usuario_id, usuario_nome } = await getAuditSession()
  await registrarAuditoria({
    tabela: 'usuarios',
    registro_id: id,
    acao: 'DELETE',
    descricao: `Usuário "${anterior.email}" desativado`,
    dados_anteriores: anterior,
    dados_novos: usuario,
    usuario_id,
    usuario_nome,
  })

  return NextResponse.json({ ok: true })
}
