import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

type Props = { params: Promise<{ id: string }> }

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) return false
  return (session.user as any).perfil === 'admin'
}

export async function PUT(request: Request, { params }: Props) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { nome, email, perfil, ativo, senha } = body

  const data: any = { nome, email, perfil, ativo }
  if (senha && senha.length > 0) {
    data.senha_hash = await bcrypt.hash(senha, 10)
  }

  const usuario = await prisma.usuarios.update({
    where: { id },
    data,
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      created_at: true,
    },
  })

  return NextResponse.json(usuario)
}

export async function DELETE(_: Request, { params }: Props) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params

  await prisma.usuarios.update({
    where: { id },
    data: { ativo: false },
  })

  return NextResponse.json({ ok: true })
}