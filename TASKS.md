# 2026-05-07

## Feat
- Adicionado overview de setores no dashboard com distribuição, seleção por setor e resumo dinâmico.
- Adicionado KPI gráfico de disponibilidade dos últimos 6 meses com total, disponíveis e ocupados.
- Adicionados atalhos do resumo para abrir as guias de inventário com filtro por setor aplicado.
- Adicionadas notificações coloridas para mudança de foco do overview.

## Fix
- Removida a guia Setores da navegação lateral.
- Notebooks emprestados passam a contar como ocupados/não disponíveis.
- Filtro de notebooks por setor considera setor do colaborador emprestado, setor emprestado, alocação ativa e setor original.
- Corrigido corte dos rótulos de mês/ano no KPI.

## Implementação
- Cores dos setores passaram a ser estáveis por setor.
- Lista de setores passou a exibir colaboradores por setor, com contagem e percentual.
- Cards sem itens no setor selecionado ficam sem redirect.
