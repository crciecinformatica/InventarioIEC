create table if not exists public.forum_pipeline_pastas (
  id uuid primary key default uuid_generate_v4(),
  etiqueta text not null,
  pasta_id uuid not null references public.forum_pastas(id) on delete cascade,
  created_at timestamptz default now(),
  constraint forum_pipeline_pastas_etiqueta_pasta_id_key unique (etiqueta, pasta_id)
);

create index if not exists idx_forum_pipeline_pastas_etiqueta
  on public.forum_pipeline_pastas(etiqueta);

create index if not exists idx_forum_pipeline_pastas_pasta_id
  on public.forum_pipeline_pastas(pasta_id);

insert into public.forum_pipeline_pastas (etiqueta, pasta_id)
select 'tutorial', id
from public.forum_pastas
where nome ilike any (array['%tutorial%', '%tutoriais%'])
on conflict (etiqueta, pasta_id) do nothing;
