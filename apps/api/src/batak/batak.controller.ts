import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BatakPinGuard } from './batak-pin.guard';
import { BatakService } from './batak.service';
import { CreateBatakEventoDto } from './dto/create-evento.dto';
import { CreateBatakPuntuacionDto } from './dto/create-puntuacion.dto';
import { isPinRequired } from '../common/pin-mode';

/**
 * Ranking de la máquina Batak en ferias.
 *
 * Las lecturas son públicas: la TV del stand no inicia sesión. Las escrituras
 * piden el PIN compartido en la cabecera `x-batak-pin`.
 */
@Controller('batak')
export class BatakController {
  constructor(private readonly batak: BatakService) {}

  /** Comprueba el PIN del iPad: 200 si es válido (o no hay PIN), 401 si no. */
  @Get('pin')
  @UseGuards(BatakPinGuard)
  comprobarPin(): { ok: true; requierePin: boolean } {
    return { ok: true, requierePin: isPinRequired() };
  }

  @Get('activo')
  activo() {
    return this.batak.estadoActivo();
  }

  @Get('eventos')
  eventos() {
    return this.batak.listarEventos();
  }

  @Post('eventos')
  @UseGuards(BatakPinGuard)
  crearEvento(@Body() dto: CreateBatakEventoDto) {
    return this.batak.crearEvento(dto);
  }

  @Patch('eventos/:id/activar')
  @UseGuards(BatakPinGuard)
  activarEvento(@Param('id', ParseUUIDPipe) id: string) {
    return this.batak.activarEvento(id);
  }

  @Delete('eventos/:id')
  @UseGuards(BatakPinGuard)
  borrarEvento(@Param('id', ParseUUIDPipe) id: string) {
    return this.batak.borrarEvento(id);
  }

  @Get('puntuaciones')
  puntuaciones() {
    return this.batak.listarTodas();
  }

  @Post('puntuaciones')
  @UseGuards(BatakPinGuard)
  crearPuntuacion(@Body() dto: CreateBatakPuntuacionDto) {
    return this.batak.crearPuntuacion(dto);
  }

  @Delete('puntuaciones/:id')
  @UseGuards(BatakPinGuard)
  borrarPuntuacion(@Param('id', ParseUUIDPipe) id: string) {
    return this.batak.borrarPuntuacion(id);
  }
}
