import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) return false
  return (session.user as any).perfil === 'admin'
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const usuarios = await prisma.usuarios.findMany({
    select: { id: true, nome: true, email: true, perfil: true, ativo: true, created_at: true },
    orderBy: { nome: 'asc' },
  })
  return NextResponse.json(usuarios)
}

export async function POST(request: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const { nome, email, senha, perfil } = await request.json()
  if (!nome || !email || !senha) return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  const existe = await prisma.usuarios.findUnique({ where: { email } })
  if (existe) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
  const senha_hash = await bcrypt.hash(senha, 10)
  const usuario = await prisma.usuarios.create({
    data: { nome, email, senha_hash, perfil: perfil || 'viewer', ativo: true },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true, created_at: true },
  })
  return NextResponse.json(usuario, { status: 201 })
}