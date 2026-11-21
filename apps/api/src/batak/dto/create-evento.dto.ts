import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBatakEventoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nombre!: string;

  /** Fecha en formato YYYY-MM-DD */
  @IsDateString()
  fecha!: string;
}
