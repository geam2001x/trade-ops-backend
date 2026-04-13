import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class ReceiveInventoryLotDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  shipmentItemId!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  warehouseId!: number;

  @IsString()
  @MinLength(2)
  lotCode!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  receivedQuantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  allocatedImportCostUsd?: number;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

