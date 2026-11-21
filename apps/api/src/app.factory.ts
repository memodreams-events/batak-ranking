import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Express } from 'express';
import { AppModule } from './app.module';
import { assertPinModeIsSafe } from './common/pin-mode';

/** Orígenes permitidos: el front desplegado, sus previews y el dev local. */
function corsOrigin(): (
  origin: string | undefined,
  cb: (e: Error | null, ok?: boolean) => void,
) => void {
  const configured = (process.env.WEB_ORIGIN ?? '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const allowed = new Set([...configured, 'http://localhost:5173', 'http://127.0.0.1:5173']);

  return (origin, callback) => {
    // Sin Origin = curl, health checks o same-origin: no es una petición de navegador.
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (allowed.has(normalized) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(normalized)) {
      return callback(null, true);
    }
    return callback(new Error(`Origen no permitido: ${origin}`));
  };
}

/** Configuración común al servidor local y al handler serverless. */
export async function createApp(adapter?: ExpressAdapter): Promise<INestApplication> {
  // Antes de levantar nada: sin PIN en producción el API queda abierto.
  assertPinModeIsSafe();

  const app = adapter
    ? await NestFactory.create(AppModule, adapter, { logger: ['error', 'warn', 'log'] })
    : await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.setGlobalPrefix('v1');
  app.enableCors({
    origin: corsOrigin(),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    // El iPad manda el PIN en una cabecera propia; sin declararla aquí el
    // preflight la rechaza y todas las escrituras fallan desde el navegador.
    allowedHeaders: ['Content-Type', 'x-batak-pin'],
    maxAge: 86_400,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  return app;
}

/** Instancia cacheada entre invocaciones de la misma lambda (evita el cold start). */
let cached: Promise<Express> | undefined;

export function getServerlessHandler(server: Express): Promise<Express> {
  cached ??= (async () => {
    const app = await createApp(new ExpressAdapter(server));
    await app.init();
    Logger.log('Nest inicializado en modo serverless', 'Bootstrap');
    return server;
  })();
  return cached;
}
