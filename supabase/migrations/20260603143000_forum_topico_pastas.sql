create table if not exists public.forum_topico_pastas (
  id uuid primary key default uuid_generate_v4(),
  topico_id uuid not null references public.forum_topicos(id) on delete cascade,
  pasta_id uuid not null references public.forum_pastas(id) on delete cascade,
  created_at timestamptz default now(),
  constraint forum_topico_pastas_topico_id_pasta_id_key unique (topico_id, pasta_id)
);

create index if not exists idx_forum_topico_pastas_topico_id
  on public.forum_topico_pastas(topico_id);

create index if not exists idx_forum_topico_pastas_pasta_id
  on public.forum_topico_pastas(pasta_id);
