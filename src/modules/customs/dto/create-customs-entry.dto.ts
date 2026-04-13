import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

import { CustomsEntryStatus } from '../enums/customs-entry-status.enum';

export class CreateCustomsEntryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  shipmentId!: number;

  @IsString()
  @MinLength(2)
  entryNumber!: string;

  @IsOptional()
  @IsDateString()
  arrivalDateChile?: string;

  @IsOptional()
  @IsDateString()
  clearanceDate?: string;

  @IsOptional()
  @IsEnum(CustomsEntryStatus)
  status?: CustomsEntryStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

