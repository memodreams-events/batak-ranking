-- Cierra el acceso directo a los datos desde el navegador.
--
-- La `anon key` viaja dentro del bundle de JavaScript y este repo es público,
-- así que hay que darla por conocida. Mientras existieran políticas de SELECT
-- para `anon`, cualquiera podía saltarse el API y leer las tablas directamente
-- por PostgREST: el login de la web no habría servido de nada.
--
-- A partir de aquí: RLS sigue activo y sin ninguna política, de modo que solo
-- `service_role` (es decir, el API) entra. La anon key del navegador queda
-- únicamente para iniciar sesión.

drop policy if exists "batak_eventos lectura publica"      on public.batak_eventos;
drop policy if exists "batak_puntuaciones lectura publica" on public.batak_puntuaciones;

-- Por si acaso: RLS activo en ambas (ya lo estaba en 0001).
alter table public.batak_eventos      enable row level security;
alter table public.batak_puntuaciones enable row level security;

-- Y sin privilegios de tabla para los roles del navegador, como segunda capa
-- por si algún día alguien añade una política por error.
revoke all on public.batak_eventos      from anon, authenticated;
revoke all on public.batak_puntuaciones from anon, authenticated;
