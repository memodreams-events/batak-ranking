import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateBatakPuntuacionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nombre!: string;

  @IsInt()
  @Min(0)
  @Max(1_000_000)
  puntos!: number;
}
