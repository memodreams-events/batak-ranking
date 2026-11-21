const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1').replace(/\/$/, '');

const PIN_KEY = 'batak_pin';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** localStorage revienta en modo privado de Safari, que es justo donde acaba el iPad del stand. */
export function getPin(): string {
  try {
    return localStorage.getItem(PIN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setPin(pin: string): void {
  try {
    localStorage.setItem(PIN_KEY, pin);
  } catch {
    /* sin almacenamiento: el PIN vale para esta sesión y se vuelve a pedir */
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Manda el PIN guardado. Solo lo necesitan las escrituras. */
  withPin?: boolean;
  /** PIN concreto, para comprobarlo antes de guardarlo. */
  pin?: string;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, withPin = false, pin } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const effectivePin = pin ?? (withPin ? getPin() : '');
  if (effectivePin) headers['x-batak-pin'] = effectivePin;

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
