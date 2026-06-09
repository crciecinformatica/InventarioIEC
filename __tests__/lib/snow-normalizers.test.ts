import {
  identifySnowReportType,
  normalizeHeader,
  normalizeHostname,
  normalizeIp,
  toPrismaDate,
} from '@/lib/snow/normalizers'

describe('lib/snow/normalizers', () => {
  it('identifica relatórios SNOW por assunto ou arquivo', () => {
    expect(identifySnowReportType('[PSG]Ativos descobertos que não são inventariados')).toBe('ativos_nao_inventariados')
    expect(identifySnowReportType('[PSG]Computadores fora da Organização')).toBe('computadores_fora_organizacao')
    expect(identifySnowReportType('[PSG] Computadores à serem arquivados')).toBe('computadores_a_serem_arquivados')
  })

  it('prioriza a primeira fonte que identifica o relatório', () => {
    expect(identifySnowReportType(
      '2026-06-02 - [PSG] Computadores à serem arquivados.xlsx',
      '[PSG]Ativos descobertos que não são inventariados'
    )).toBe('computadores_a_serem_arquivados')
  })

  it('normaliza cabeçalhos com acentos e espaços', () => {
    expect(normalizeHeader('Endereço IP')).toBe('endereco_ip')
    expect(normalizeHeader('Nome do Computador')).toBe('nome_do_computador')
  })

  it('normaliza IP válido e rejeita octetos inválidos', () => {
    expect(normalizeIp('IP: 10.145.18.32')).toBe('10.145.18.32')
    expect(normalizeIp('10.145.18.999')).toBeNull()
  })

  it('normaliza hostname para comparação', () => {
    expect(normalizeHostname('sgbiecadmi08032.domain.local')).toBe('SGBIECADMI08032')
    expect(normalizeHostname('')).toBeNull()
  })

  it('converte data curta para Date compatível com Prisma', () => {
    expect(toPrismaDate('2026-01-01')?.toISOString()).toBe('2026-01-01T00:00:00.000Z')
    expect(toPrismaDate(null)).toBeNull()
  })
})
