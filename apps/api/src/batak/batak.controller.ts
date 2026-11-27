import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { BatakService } from './batak.service';
import { CreateBatakEventoDto } from './dto/create-evento.dto';
import { CreateBatakPuntuacionDto } from './dto/create-puntuacion.dto';
import { ImportarDto } from './dto/importar.dto';

/**
 * Ranking de la máquina Batak en ferias.
 *
 * Todo exige sesión salvo `GET /batak/activo`, que es lo único que necesita la
 * pantalla pública del QR. El resto —el histórico completo, la lista de
 * eventos y cualquier escritura— queda cerrado: es una feria con mucha gente y
 * la URL del API está a la vista de cualquiera.
 */
@Controller('batak')
export class BatakController {
  constructor(private readonly batak: BatakService) {}

  /** Ranking del evento activo. Público: lo lee la pantalla del QR (/r) y la TV. */
  @Get('activo')
  @Public()
  activo() {
    return this.batak.estadoActivo();
  }

  /** Apertura de la pantalla del QR. Pública: la manda el móvil de un visitante. */
  @Post('visita')
  @Public()
  @HttpCode(204)
  visita() {
    return this.batak.registrarVisita();
  }

  @Get('eventos')
  eventos() {
    return this.batak.listarEventos();
  }

  /** Ficha de un evento: sus partidas y las aperturas del QR. */
  @Get('eventos/:id')
  detalleEvento(@Param('id', ParseUUIDPipe) id: string) {
    return this.batak.detalleEvento(id);
  }

  @Post('eventos')
  crearEvento(@Body() dto: CreateBatakEventoDto) {
    return this.batak.crearEvento(dto);
  }

  @Patch('eventos/:id/activar')
  activarEvento(@Param('id', ParseUUIDPipe) id: string) {
    return this.batak.activarEvento(id);
  }

  /** Deja el sistema sin evento en curso: la TV pasa a "Sin evento activo". */
  @Patch('eventos/:id/desactivar')
  desactivarEvento(@Param('id', ParseUUIDPipe) id: string) {
    return this.batak.desactivarEvento(id);
  }

  /** `?force=true` borra también las partidas del evento. Sin él, un evento con partidas da 409. */
  @Delete('eventos/:id')
  borrarEvento(@Param('id', ParseUUIDPipe) id: string, @Query('force') force?: string) {
    return this.batak.borrarEvento(id, force === 'true');
  }

  @Get('puntuaciones')
  puntuaciones() {
    return this.batak.listarTodas();
  }

  @Post('puntuaciones')
  crearPuntuacion(@Body() dto: CreateBatakPuntuacionDto) {
    return this.batak.crearPuntuacion(dto);
  }

  @Delete('puntuaciones/:id')
  borrarPuntuacion(@Param('id', ParseUUIDPipe) id: string) {
    return this.batak.borrarPuntuacion(id);
  }

  /** Carga un histórico completo desde un CSV ya parseado en el navegador. */
  @Post('importar')
  importar(@Body() dto: ImportarDto) {
    return this.batak.importar(dto);
  }
}
