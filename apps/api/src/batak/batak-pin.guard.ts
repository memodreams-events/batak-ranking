import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { isPinRequired } from '../common/pin-mode';

/**
 * Protege las escrituras con un PIN compartido (cabecera `x-batak-pin`).
 *
 * Si BATAK_PIN está vacío las escrituras quedan abiertas, lo cual solo es
 * aceptable en local: `assertPinModeIsSafe` impide arrancar así en producción.
 */
@Injectable()
export class BatakPinGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!isPinRequired()) return true;

    const expected = (process.env.BATAK_PIN ?? '').trim();
    const request = context.switchToHttp().getRequest<Request>();
    const given = String(request.headers['x-batak-pin'] ?? '').trim();

    if (!timingSafeEqual(given, expected)) {
      throw new UnauthorizedException('PIN incorrecto');
    }
    return true;
  }
}

/**
 * Comparación en tiempo constante. Un PIN de 4 dígitos es corto y el API es
 * público: con `!==` la diferencia de tiempo entre fallar en el primer dígito
 * y en el último es medible, y reduce el espacio de búsqueda de 10.000 a 40.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
