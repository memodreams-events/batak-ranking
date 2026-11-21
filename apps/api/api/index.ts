import 'reflect-metadata';
import express from 'express';
import type { Request, Response } from 'express';
import { getServerlessHandler } from '../src/app.factory';

// Vercel invoca este handler por cada petición. `getServerlessHandler` cachea la
// instancia de Nest en el módulo, así que solo la primera invocación de cada
// lambda paga el arranque (~1-2 s); las siguientes van directas.
const server = express();

export default async function handler(req: Request, res: Response): Promise<void> {
  const app = await getServerlessHandler(server);
  app(req, res);
}
