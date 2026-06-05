alter table solicitacoes_inventario
  drop constraint if exists chk_solicitacoes_inventario_tipo_recurso;

alter table solicitacoes_inventario
  add constraint chk_solicitacoes_inventario_tipo_recurso
  check (tipo_recurso in (
    'maquinas',
    'notebooks',
    'aparelhos',
    'impressoras',
    'ramais',
    'racks',
    'alocacoes_maquinas',
    'alocacoes_notebooks',
    'alocacoes_aparelhos',
    'alocacoes_ramais',
    'colaboradores',
    'forum_arquivos'
  ));

alter table solicitacoes_inventario
  drop constraint if exists chk_solicitacoes_inventario_acao;

alter table solicitacoes_inventario
  add constraint chk_solicitacoes_inventario_acao
  check (acao in (
    'CREATE',
    'UPDATE',
    'DELETE',
    'ALLOCATE',
    'DEALLOCATE',
    'CORRECTION',
    'UPLOAD'
  ));
