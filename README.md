# Batak Ranking

Ranking de puntuaciones de la máquina Batak para los stands de feria. Una feria = un evento, y las
puntuaciones que se apuntan van siempre al evento activo.

Todas las pantallas son **públicas, sin login**: la TV del stand no inicia sesión. Lo que está
protegido son las escrituras, con un PIN compartido.

| Pantalla | Ruta | Para quién |
| --- | --- | --- |
| TV del stand | `/pantalla` | Pantalla grande, se actualiza sola cada 4 s |
| Apuntar | `/apuntar` | iPad del azafato: nombre + puntuación |
| Eventos | `/eventos` | Crear y activar eventos |
| Histórico | `/historico` | Ranking global de todos los eventos + exportar CSV |

El ranking muestra **el récord de cada jugador**, no su última partida. Si Ana juega tres veces,
sale una vez con su mejor puntuación. Los empates los gana quien lo consiguió antes.

## Estructura

```
apps/web         React 18 + Vite + Tailwind      (front)
apps/api         NestJS 10                       (back, serverless en Vercel)
packages/shared  tipos y cálculo del ranking
supabase/        migraciones SQL
```

## Puesta en marcha

```bash
npm install

# 1. Crear un proyecto en supabase.com (región de Europa)
# 2. Pegar supabase/migrations/0001_init.sql en el SQL Editor y ejecutarlo
# 3. Rellenar las claves (Project Settings -> API):
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

npm run dev    # web :5173, api :3000
```

Comandos útiles:

```bash
npm run build   # shared -> api -> web
npm test        # ranking, guard del PIN y candado de producción
npm run lint
```

## El PIN

Leer es público. Escribir (apuntar, borrar, crear eventos) pide el PIN de `BATAK_PIN`, que el
cliente manda en la cabecera `x-batak-pin`. El iPad lo pide una vez y lo recuerda en
`localStorage`.

En local, sin `BATAK_PIN`, las escrituras quedan abiertas: es cómodo para desarrollar. **En
producción el API se niega a arrancar sin PIN**, en vez de limitarse a avisar. Un API de escritura
abierto no da ningún síntoma visible hasta que alguien te llena el ranking de basura en mitad de
una feria, así que preferimos que falle el despliegue.

## Decisiones que conviene no deshacer sin pensarlo

- **El cálculo del ranking vive en `packages/shared`.** Lo necesitan los dos lados: la web para
  pintar la tabla y el API para decirle al iPad qué puesto ha alcanzado la partida recién apuntada.
  Si se duplica, el puesto del aviso deja de coincidir con el de la TV.
- **Solo puede haber un evento activo, y lo garantiza Postgres** con un índice único parcial
  (`batak_eventos_un_solo_activo`), no la disciplina de quien escriba el código. Activar un evento
  son dos UPDATE que no pueden quedarse a medias, así que van dentro de una función de Postgres
  (`batak_activar_evento`): PostgREST no tiene transacciones entre peticiones.
- **Las funciones SQL están revocadas para `anon`.** Postgres concede EXECUTE a PUBLIC en cada
  función nueva; sin el `revoke` del final de la migración, cualquiera con la anon key podría crear
  y activar eventos por PostgREST saltándose el PIN.
- **RLS solo permite SELECT.** No hay políticas de escritura, así que escribir exige `service_role`
  y eso solo lo tiene el API. Aunque alguien saque la anon key del bundle del front, no puede tocar
  una fila.
- **El PIN se compara en tiempo constante.** Son 4 dígitos y el API es público: con `!==` la
  diferencia de tiempo entre fallar en el primer dígito y en el último es medible.
- **Borrar un evento con partidas devuelve 409.** La clave ajena es `ON DELETE CASCADE`, así que un
  borrado alegre se llevaría el histórico por delante sin avisar.

## Despliegue

Dos proyectos de Vercel sobre este mismo repo:

| Proyecto | Root Directory | Variables |
| --- | --- | --- |
| `batak-ranking-web` | `apps/web` | `VITE_API_URL` |
| `batak-ranking-api` | `apps/api` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BATAK_PIN`, `WEB_ORIGIN` |

El API es un proyecto de solo funciones: necesita `outputDirectory` y un `public/` mínimo en
`vercel.json`, o Vercel falla con "No Output Directory found". Y `vercel-build` compila
`packages/shared` antes que el API.

## API

Todos los endpoints cuelgan de `/v1`.

| Método | Ruta | PIN | Descripción |
| --- | --- | --- | --- |
| GET | `/batak/activo` | no | Evento activo + sus puntuaciones |
| GET | `/batak/eventos` | no | Lista de eventos con nº de partidas |
| GET | `/batak/puntuaciones` | no | Todas las partidas (histórico) |
| GET | `/batak/pin` | sí | Comprueba el PIN |
| POST | `/batak/eventos` | sí | Crea un evento y lo activa |
| PATCH | `/batak/eventos/:id/activar` | sí | Activa un evento |
| DELETE | `/batak/eventos/:id` | sí | Borra un evento sin partidas |
| POST | `/batak/puntuaciones` | sí | Apunta una partida en el evento activo; devuelve el puesto |
| DELETE | `/batak/puntuaciones/:id` | sí | Borra una partida |

## Origen

Hasta noviembre de 2026 esto vivía dentro de `memo-manager` (Angular + Prisma + Postgres en
Fly.io). Se sacó a su propio repo con la estructura de `lista-regalos`: React en vez de Angular y
Supabase en vez de Prisma. El modelo de datos y el comportamiento son los mismos.
