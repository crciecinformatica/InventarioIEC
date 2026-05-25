import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function POST(_: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  const { id } = await params
  await prisma.forum_topicos.update({
    where: { id },
    data: { views: { increment: 1 } },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}