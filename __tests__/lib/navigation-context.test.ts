import {
  INSPECT_CONTEXT_STORAGE_KEY,
  buildInspectHref,
  consumePendingInspectPreview,
  createInspectContext,
  getReturnContextForRoute,
  getReturnOptions,
  inferInspectPreview,
  readInspectContext,
  readInspectHistory,
  removeInspectHref,
  updateInspectHistory,
  writeInspectContext,
  writeInspectHistory,
  writePendingInspectPreview,
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
      title: 'Colaborador',
      subtitle: undefined,
      href: '/colaboradores?inspect=abc&setor_id=123',
      timestamp: 1000,
    })
  })

  test('ignora rotas sem inspect ou fora do inventario inspecionavel', () => {
    expect(createInspectContext('/colaboradores', 'setor_id=123')).toBeNull()
    expect(createInspectContext('/usuarios', 'inspect=abc')).toMatchObject({
      path: '/usuarios',
      inspectId: 'abc',
      type: 'usuario',
      label: 'Usuário',
    })
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

  test('mantem uma pilha recente e exclui o item atual das opcoes de retorno', () => {
    const colaborador = createInspectContext('/colaboradores', 'inspect=colab-1', 1000, { title: 'Ana' })!
    const maquina = createInspectContext('/maquinas', 'inspect=maq-1', 2000, { title: 'PC-01' })!
    const notebook = createInspectContext('/notebooks', 'inspect=note-1', 3000, { title: 'E480' })!

    const history = updateInspectHistory(updateInspectHistory(updateInspectHistory([], colaborador), maquina), notebook)

    expect(history.map(item => item.title)).toEqual(['E480', 'PC-01', 'Ana'])
    expect(getReturnOptions(history, notebook.href).map(item => item.title)).toEqual(['PC-01', 'Ana'])
    expect(updateInspectHistory(history, maquina).map(item => item.title)).toEqual(['PC-01', 'E480', 'Ana'])
  })

  test('persiste pilha e previews pendentes de inspect', () => {
    const context = createInspectContext('/maquinas', 'inspect=maq-1', 1000, { title: 'PC-01', subtitle: 'TI' })!
    writeInspectHistory(window.sessionStorage, [context])

    expect(readInspectHistory(window.sessionStorage)).toEqual([context])

    writePendingInspectPreview(window.sessionStorage, context.href, { title: 'PC-01', subtitle: 'TI' })
    expect(consumePendingInspectPreview(window.sessionStorage, context.href)).toEqual({ title: 'PC-01', subtitle: 'TI' })
    expect(consumePendingInspectPreview(window.sessionStorage, context.href)).toBeNull()
  })

  test('infere preview a partir do registro clicado', () => {
    expect(inferInspectPreview({ nome_host: 'PC-01', setor_nome: 'TI' })).toEqual({ title: 'PC-01', subtitle: 'TI' })
    expect(inferInspectPreview({ modelo: 'E480', fabricante: 'Lenovo' })).toEqual({ title: 'E480', subtitle: 'Lenovo E480' })
  })
})
