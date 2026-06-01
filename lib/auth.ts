import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null

        const usuario = await prisma.usuarios.findUnique({
          where: { email: credentials.email, ativo: true },
        })

        if (!usuario) return null

        const senhaValida = await bcrypt.compare(credentials.senha, usuario.senha_hash)
        if (!senhaValida) return null

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.perfil = (user as any).perfil
        token.name = user.name
        token.email = user.email
      } else if (token.email) {
        const usuario = await prisma.usuarios.findUnique({
          where: { email: token.email as string, ativo: true },
          select: { id: true, nome: true, email: true, perfil: true },
        })
        if (usuario) {
          token.id = usuario.id
          token.name = usuario.nome
          token.email = usuario.email
          token.perfil = usuario.perfil ?? 'viewer'
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id
        session.user.name = token.name ?? session.user.name
        session.user.email = token.email ?? session.user.email
        ;(session.user as any).perfil = token.perfil
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
}

/**
 * Verifica se a sessão corrente pertence a um admin.
 * Retorna null se autorizado, ou um NextResponse 403 pronto para retornar.
 *
 * Uso nas rotas PUT/DELETE:
 *   const denied = await requireAdmin()
 *   if (denied) return denied
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  const perfil = (session?.user as any)?.perfil ?? 'viewer'
  if (!isPrivilegedProfile(perfil)) {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores e desenvolvimento podem realizar esta ação.' },
      { status: 403 },
    )
  }
  return null
}

export function isPrivilegedProfile(perfil?: string | null) {
  return perfil === 'admin' || perfil === 'dev'
}
