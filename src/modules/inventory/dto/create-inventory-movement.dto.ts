import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { InventoryMovementType } from '../enums/inventory-movement-type.enum';

export class CreateInventoryMovementDto {
  @IsEnum(InventoryMovementType)
  movementType!: InventoryMovementType;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  referenceId?: number;

  @IsOptional()
  @IsDateString()
  movementDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

