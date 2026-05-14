import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      perfil: string
    }
  }

  interface User {
    id: string
    name: string
    email: string
    perfil: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    perfil: string
  }
}
