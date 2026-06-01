import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isPrivilegedProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getAuditSession, registrarAuditoria } from '@/lib/audit'

export const runtime = 'nodejs'

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

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const usuarios = await prisma.usuarios.findMany({
    select: {
      id: true,
      nome: true,
      codigo_pessoa: true,
      email: true,
      perfil: true,
      ativo: true,
      created_at: true,
      _count: { select: { forum_topicos: true, forum_comentarios: true, forum_reacoes: true } },
    },
    orderBy: { nome: 'asc' },
  })
  const auditCounts = await prisma.audit_log.groupBy({
    by: ['usuario_id'],
    where: { usuario_id: { in: usuarios.map(u => u.id) } },
    _count: { _all: true },
  })
  const countsByUser = new Map(auditCounts.map(item => [item.usuario_id, item._count._all]))
  const mapped = usuarios.map(usuario => ({
    ...usuario,
    total_acoes: countsByUser.get(usuario.id) ?? 0,
    forum_acoes:
      usuario._count.forum_topicos +
      usuario._count.forum_comentarios +
      usuario._count.forum_reacoes,
    _count: undefined,
  }))
  return NextResponse.json(mapped)
}

export async function POST(request: Request) {
  const session = await getPrivilegedSession()
  if (!session) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const { nome, codigo_pessoa, email, senha, perfil } = await request.json()
  if (!nome || !email || !senha) return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  const existe = await prisma.usuarios.findUnique({ where: { email } })
  if (existe) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
  if (codigo_pessoa) {
    const existeCodigo = await prisma.usuarios.findFirst({
      where: { codigo_pessoa: { equals: codigo_pessoa, mode: 'insensitive' } },
      select: { id: true },
    })
    if (existeCodigo) return NextResponse.json({ error: 'Código de pessoa já cadastrado' }, { status: 409 })
  }
  const senha_hash = await bcrypt.hash(senha, 10)
  const { usuario_id, usuario_nome } = await getAuditSession()
  const canSetRole = (session.user as any).perfil === 'dev'
  const usuario = await prisma.usuarios.create({
    data: { nome, codigo_pessoa: codigo_pessoa || null, email, senha_hash, perfil: canSetRole ? (perfil || 'viewer') : 'viewer', ativo: true },
    select: { id: true, nome: true, codigo_pessoa: true, email: true, perfil: true, ativo: true, created_at: true },
  })
  await registrarAuditoria({
    tabela: 'usuarios',
    registro_id: usuario.id,
    acao: 'CREATE',
    descricao: `Usuário "${usuario.email}" criado`,
    dados_novos: usuario,
    usuario_id,
    usuario_nome,
  })
  return NextResponse.json(usuario, { status: 201 })
}
