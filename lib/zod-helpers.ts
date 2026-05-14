import { z } from 'zod'

// Aceita number, string numérica ou vazio/null/undefined → number | null
export const optionalInt = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return isNaN(n) ? null : n
  }) as z.ZodType<number | null | undefined>

// Aceita number, string numérica ou vazio/null/undefined → number com fallback
export const intWithDefault = (def: number) =>
  z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === null || v === undefined || v === '') return def
      const n = Number(v)
      return isNaN(n) ? def : n
    }) as z.ZodType<number>