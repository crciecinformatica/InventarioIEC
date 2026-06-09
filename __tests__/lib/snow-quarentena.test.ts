import { buildQuarantineFields, quarantineStartDate, SNOW_QUARANTINE_DAYS } from '@/lib/snow/quarentena'

describe('lib/snow/quarentena', () => {
  it('calcula bloqueio de 15 dias a partir da última solicitação', () => {
    const result = buildQuarantineFields(new Date('2026-06-01T12:00:00Z'))

    expect(result.emQuarentena).toBe(true)
    expect(result.bloqueadoAte?.toISOString()).toBe('2026-06-16T12:00:00.000Z')
  })

  it('retorna livre quando não há última solicitação', () => {
    const result = buildQuarantineFields(null)

    expect(result.emQuarentena).toBe(false)
    expect(result.bloqueadoAte).toBeNull()
  })

  it('usa janela fixa de 15 dias', () => {
    expect(SNOW_QUARANTINE_DAYS).toBe(15)
    expect(quarantineStartDate(new Date('2026-06-16T00:00:00Z')).toISOString()).toBe('2026-06-01T00:00:00.000Z')
  })
})
