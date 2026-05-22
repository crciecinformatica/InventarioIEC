import {
  INSPECT_CONTEXT_STORAGE_KEY,
  buildInspectHref,
  createInspectContext,
  getReturnContextForRoute,
  readInspectContext,
  removeInspectHref,
  writeInspectContext,
} from '@/lib/navigation-context'

describe('navigation-context', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  test('cria contexto a partir de uma rota inspecionavel com inspect', () => {
    const context = createInspectContext('/colaboradores', 'inspect=abc&setor_id=123', 1000)

    expect(context).toEqual({
      path: '/colaboradores',
      inspectId: 'abc',
      type: 'colaborador',
      label: 'Colaborador',
      href: '/colaboradores?inspect=abc&setor_id=123',
      timestamp: 1000,
    })
  })

  test('ignora rotas sem inspect ou fora do inventario inspecionavel', () => {
    expect(createInspectContext('/colaboradores', 'setor_id=123')).toBeNull()
    expect(createInspectContext('/usuarios', 'inspect=abc')).toBeNull()
  })

  test('monta href preservando filtros e trocando apenas inspect', () => {
    expect(buildInspectHref('/maquinas', 'setor_id=123&inspect=old', 'new')).toBe('/maquinas?setor_id=123&inspect=new')
    expect(removeInspectHref('/maquinas', 'setor_id=123&inspect=new')).toBe('/maquinas?setor_id=123')
    expect(removeInspectHref('/maquinas', 'inspect=new')).toBe('/maquinas')
  })

  test('le e escreve contexto em sessionStorage com tolerancia a payload invalido', () => {
    const context = createInspectContext('/ramais', 'inspect=ramal-1', 2000)
    expect(context).not.toBeNull()

    writeInspectContext(window.sessionStorage, context!)
    expect(readInspectContext(window.sessionStorage)).toEqual(context)

    window.sessionStorage.setItem(INSPECT_CONTEXT_STORAGE_KEY, '{')
    expect(readInspectContext(window.sessionStorage)).toBeNull()
  })

  test('mantem o contexto anterior em uma transicao inspect para inspect', () => {
    const colaborador = createInspectContext('/colaboradores', 'inspect=colab-1', 1000)
    const maquina = createInspectContext('/maquinas', 'inspect=maq-1', 2000)

    expect(getReturnContextForRoute(maquina, colaborador)).toEqual(colaborador)
    expect(getReturnContextForRoute(maquina, null)).toEqual(maquina)
    expect(getReturnContextForRoute(null, colaborador)).toEqual(colaborador)
  })
})
