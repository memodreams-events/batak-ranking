-- Ranking de la máquina Batak en ferias.
-- Pegar en el SQL Editor de Supabase y ejecutar.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- tablas

create table if not exists public.batak_eventos (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null check (length(btrim(nombre)) between 1 and 80),
  fecha      date not null,
  activo     boolean not null default false,
  created_at timestamptz not null default now()
);

-- Como mucho un evento activo. En la versión anterior esto dependía de que
-- todas las escrituras recordasen desactivar el anterior; ahora lo impide la
-- base de datos. El índice es parcial: los inactivos no compiten entre sí.
create unique index if not exists batak_eventos_un_solo_activo
  on public.batak_eventos (activo)
  where activo;

create table if not exists public.batak_puntuaciones (
  id         uuid primary key default gen_random_uuid(),
  evento_id  uuid not null references public.batak_eventos (id) on delete cascade,
  nombre     text not null check (length(btrim(nombre)) between 1 and 60),
  puntos     integer not null check (puntos >= 0 and puntos <= 1000000),
  created_at timestamptz not null default now()
);

create index if not exists batak_puntuaciones_evento_id_idx
  on public.batak_puntuaciones (evento_id);

-- El histórico y la TV ordenan por fecha constantemente.
create index if not exists batak_puntuaciones_created_at_idx
  on public.batak_puntuaciones (created_at desc);

-- ------------------------------------------------------------------- RLS
--
-- Leer es público: la TV del stand no inicia sesión. Escribir no tiene ninguna
-- política, así que solo puede hacerlo `service_role` (que se salta RLS) desde
-- el API, y el API exige el PIN. Es decir: aunque alguien saque la anon key del
-- bundle del front, no puede tocar ni una fila.

alter table public.batak_eventos      enable row level security;
alter table public.batak_puntuaciones enable row level security;

drop policy if exists "batak_eventos lectura publica" on public.batak_eventos;
create policy "batak_eventos lectura publica"
  on public.batak_eventos for select
  to anon, authenticated
  using (true);

drop policy if exists "batak_puntuaciones lectura publica" on public.batak_puntuaciones;
create policy "batak_puntuaciones lectura publica"
  on public.batak_puntuaciones for select
  to anon, authenticated
  using (true);

-- --------------------------------------------------------------- funciones
--
-- Activar un evento son dos UPDATE que no pueden quedarse a medias, y PostgREST
-- no tiene transacciones entre peticiones. Van en una función para que sean
-- atómicos y para que el índice único de arriba nunca vea dos activos.

create or replace function public.batak_activar_evento(p_id uuid)
returns public.batak_eventos
language plpgsql
as $$
declare
  v_evento public.batak_eventos;
begin
  update public.batak_eventos set activo = false where activo and id <> p_id;
  update public.batak_eventos set activo = true  where id = p_id returning * into v_evento;
  if not found then
    raise exception 'Evento no encontrado' using errcode = 'no_data_found';
  end if;
  return v_evento;
end;
$$;

create or replace function public.batak_crear_evento(p_nombre text, p_fecha date)
returns public.batak_eventos
language plpgsql
as $$
declare
  v_evento public.batak_eventos;
begin
  update public.batak_eventos set activo = false where activo;
  insert into public.batak_eventos (nombre, fecha, activo)
  values (btrim(p_nombre), p_fecha, true)
  returning * into v_evento;
  return v_evento;
end;
$$;

-- Postgres concede EXECUTE a PUBLIC en cada función nueva. Sin este revoke,
-- cualquiera con la anon key podría llamarlas por PostgREST y crear o activar
-- eventos saltándose el PIN, justo lo que las políticas de arriba impiden.
revoke execute on function public.batak_activar_evento(uuid) from public, anon, authenticated;
revoke execute on function public.batak_crear_evento(text, date) from public, anon, authenticated;
grant  execute on function public.batak_activar_evento(uuid) to service_role;
grant  execute on function public.batak_crear_evento(text, date) to service_role;
