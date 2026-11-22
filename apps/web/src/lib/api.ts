import { supabase } from './supabase';

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Las rutas públicas (la del QR) no mandan sesión: el visitante no tiene. */
  anonymous?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, anonymous = false } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (!anonymous) {
    // getSession() renueva el token si está a punto de caducar, así que la TV
    // puede pasar la feria entera encendida sin que se le caiga la sesión.
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new ApiError('Tu sesión ha caducado. Vuelve a entrar.', 401);
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // El wifi de una feria se cae constantemente: hay que distinguirlo de un
    // error del servidor para que la cabecera diga "sin conexión" y no "error".
    throw new ApiError('Sin conexión con el servidor', 0);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new ApiError(extractMessage(payload) ?? `Error ${response.status}`, response.status);
  }

  return payload as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/** Nest devuelve `message` como string o como array de errores de validación. */
function extractMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const message = (payload as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.filter((m) => typeof m === 'string').join('. ');
  return null;
}
