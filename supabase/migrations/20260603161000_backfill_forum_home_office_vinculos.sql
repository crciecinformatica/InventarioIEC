insert into public.forum_vinculos (topico_id, tipo_item, item_id, item_label)
select
  t.id,
  'maquinas',
  m.id,
  m.nome_host
from public.forum_topicos t
join public.maquinas m
  on m.nome_host in ('SGBIECFINA08041', 'SGBIECSECR08063', 'SGBIECSECR08070')
where t.titulo = 'Home-Office'
  and not exists (
    select 1
    from public.forum_vinculos v
    where v.topico_id = t.id
      and v.tipo_item = 'maquinas'
      and v.item_id = m.id
  );
