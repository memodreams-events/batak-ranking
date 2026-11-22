import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';
import { IS_PUBLIC } from './public.decorator';
import { isAllowed } from './allowed-emails';

/**
 * Exige una sesión de Supabase válida y que el correo esté autorizado.
 *
 * Va como guard global: todo queda cerrado salvo lo marcado con @Public().
 * Cerrar por defecto y abrir a mano es lo que evita que una ruta nueva nazca
 * expuesta por despiste.
 *
 * No basta con que el token sea válido: cualquiera podría registrarse en el
 * proyecto de Supabase y obtener uno. La autorización la decide la lista de
 * correos, aquí, en el servidor.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const header = String(request.headers.authorization ?? '');
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) throw new UnauthorizedException('Falta la sesión.');

    const user = await this.supabase.getUserFromToken(token);
    if (!user) throw new UnauthorizedException('Sesión caducada o no válida.');

    if (!isAllowed(user.email)) {
      throw new ForbiddenException('Esta cuenta no tiene acceso.');
    }

    return true;
  }
}
