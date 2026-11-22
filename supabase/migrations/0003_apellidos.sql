-- Apellidos, para poder distinguir a dos personas con el mismo nombre.
--
-- Hasta ahora la clasificación agrupaba por nombre, así que dos "Pepe"
-- distintos acababan fundidos en una sola fila con el mejor resultado de los
-- dos. En una feria con mucha gente eso no es un caso raro, es lo normal.
--
-- La columna entra con DEFAULT '' para que las partidas ya apuntadas sigan
-- siendo válidas: se quedan sin apellido y se muestran solo con el nombre.

alter table public.batak_puntuaciones
  add column if not exists apellidos text not null default '';

alter table public.batak_puntuaciones
  drop constraint if exists batak_puntuaciones_apellidos_len;

alter table public.batak_puntuaciones
  add constraint batak_puntuaciones_apellidos_len
  check (length(btrim(apellidos)) <= 80);
