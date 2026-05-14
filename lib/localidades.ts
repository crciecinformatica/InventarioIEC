import { prisma } from '@/lib/prisma'

export const LOCALIDADE_PADRAO = 'IEC - São Gabriel'

export async function getLocalidadePadraoId() {
  const localidade = await prisma.localidades.findUnique({
    where: { nome: LOCALIDADE_PADRAO },
    select: { id: true },
  })

  return localidade?.id ?? null
}

export async function withLocalidadePadrao<T extends { localidade_id?: string | null }>(data: T) {
  if (data.localidade_id !== undefined) return data
  return {
    ...data,
    localidade_id: await getLocalidadePadraoId(),
  }
}
