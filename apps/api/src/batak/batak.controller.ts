import {
  Body,
  Controller,
  Delete,
  Get,
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

  @Get('eventos')
  eventos() {
    return this.batak.listarEventos();
  }

  @Post('eventos')
  crearEvento(@Body() dto: CreateBatakEventoDto) {
    return this.batak.crearEvento(dto);
  }

  @Patch('eventos/:id/activar')
  activarEvento(@Param('id', ParseUUIDPipe) id: string) {
    return this.batak.activarEvento(id);
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
}
