alter table public.forum_topico_pastas
  drop constraint if exists forum_topico_pastas_topico_id_fkey;

alter table public.forum_topico_pastas
  add constraint forum_topico_pastas_topico_id_fkey
  foreign key (topico_id)
  references public.forum_topicos(id)
  on delete cascade
  on update cascade;

alter table public.forum_topico_pastas
  drop constraint if exists forum_topico_pastas_pasta_id_fkey;

alter table public.forum_topico_pastas
  add constraint forum_topico_pastas_pasta_id_fkey
  foreign key (pasta_id)
  references public.forum_pastas(id)
  on delete cascade
  on update cascade;

alter table public.forum_pipeline_pastas
  drop constraint if exists forum_pipeline_pastas_pasta_id_fkey;

alter table public.forum_pipeline_pastas
  add constraint forum_pipeline_pastas_pasta_id_fkey
  foreign key (pasta_id)
  references public.forum_pastas(id)
  on delete cascade
  on update cascade;
