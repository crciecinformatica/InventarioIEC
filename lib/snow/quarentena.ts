export const SNOW_QUARANTINE_DAYS = 15

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function quarantineStartDate(now = new Date()) {
  return addDays(now, -SNOW_QUARANTINE_DAYS)
}

export function buildQuarantineFields(lastRequestDate: Date | string | null) {
  if (!lastRequestDate) {
    return {
      emQuarentena: false,
      dataUltimaSolicitacao: null,
      bloqueadoAte: null,
    }
  }

  const dataUltimaSolicitacao = lastRequestDate instanceof Date
    ? lastRequestDate
    : new Date(lastRequestDate)

  return {
    emQuarentena: true,
    dataUltimaSolicitacao,
    bloqueadoAte: addDays(dataUltimaSolicitacao, SNOW_QUARANTINE_DAYS),
  }
}
