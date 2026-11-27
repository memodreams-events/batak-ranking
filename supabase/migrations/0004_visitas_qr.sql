-- Aperturas de la pantalla pública del QR, por evento.
--
-- Mide aperturas de página desde un navegador, no personas: no hay forma de
-- saber si dos visitas son de la misma persona sin rastrearla, y no queremos
-- hacerlo. El cliente manda una visita por sesión de navegador, así que
-- recargar la página o dejarla abierta refrescándose no infla la cifra.
--
-- No se guarda IP, ni user agent, ni identificador alguno: solo el evento y
-- el momento. Lo único que se puede responder con esta tabla es "cuántas
-- veces se abrió" y "a qué horas", que es justo lo que interesa.

create table if not exists public.batak_visitas (
  id         uuid primary key default gen_random_uuid(),
  evento_id  uuid not null references public.batak_eventos (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists batak_visitas_evento_id_idx
  on public.batak_visitas (evento_id);

alter table public.batak_visitas enable row level security;

-- Sin políticas: igual que el resto de tablas, solo entra el API con
-- service_role. La anon key del navegador no puede ni leer ni escribir aquí.
revoke all on public.batak_visitas from anon, authenticated;
