import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/**
 * Marca una ruta como accesible sin iniciar sesión.
 *
 * Úsalo con cuentagotas: todo lo que lleve este decorador queda expuesto a
 * internet. Hoy solo lo llevan el health check y el ranking del evento activo,
 * que es lo que lee la pantalla pública del QR.
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);
