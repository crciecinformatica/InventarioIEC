import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isPrivilegedProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

async function checkPrivileged() {
  const session = await getServerSession(authOptions)
  if (!session) return false
  return isPrivilegedProfile((session.user as any).perfil)
}

export async function GET() {
  if (!await checkPrivileged()) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const solicitacoes = await prisma.solicitacoes_usuarios.findMany({
      where: { status: { in: ['pendente', 'revisao'] } },
      select: {
        id: true,
        nome: true,
        codigo_pessoa: true,
        email: true,
        status: true,
        observacao: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'asc' },
    })

    return NextResponse.json(solicitacoes)
  } catch (err) {
    if (isMissingSolicitacoesUsuariosTable(err)) {
      return NextResponse.json([])
    }
    console.error('[GET /api/admin/usuarios/solicitacoes]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function isMissingSolicitacoesUsuariosTable(err: unknown) {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2021'
  )
}
