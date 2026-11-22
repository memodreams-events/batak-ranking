import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ImportarFilaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  apellidos?: string;

  @IsInt()
  @Min(0)
  @Max(1_000_000)
  puntos!: number;

  /** Nombre del evento. Si no viene, la fila va al evento activo. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  evento?: string;

  /** YYYY-MM-DD. Solo se usa al crear un evento que no existía. */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  fechaEvento?: string;

  /** Fecha y hora original de la partida, para no perder el orden del histórico. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  createdAt?: string;
}

export class ImportarDto {
  @IsArray()
  @ArrayMinSize(1)
  // Un tope alto pero finito: evita que un fichero corrupto intente meter
  // millones de filas en una petición.
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => ImportarFilaDto)
  filas!: ImportarFilaDto[];
}
