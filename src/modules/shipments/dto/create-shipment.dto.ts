import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { CreateShipmentItemDto } from './create-shipment-item.dto';
import { ShipmentStatus } from '../enums/shipment-status.enum';
import { TransportMode } from '../enums/transport-mode.enum';

export class CreateShipmentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  purchaseOrderId!: number;

  @IsString()
  @MinLength(2)
  shipmentNumber!: string;

  @IsEnum(TransportMode)
  transportMode!: TransportMode;

  @IsOptional()
  @IsString()
  carrierName?: string;

  @IsOptional()
  @IsString()
  originLocation?: string;

  @IsOptional()
  @IsString()
  destinationLocation?: string;

  @IsOptional()
  @IsString()
  trackingReference?: string;

  @IsOptional()
  @IsDateString()
  etd?: string;

  @IsOptional()
  @IsDateString()
  eta?: string;

  @IsOptional()
  @IsDateString()
  actualDepartureAt?: string;

  @IsOptional()
  @IsDateString()
  actualArrivalAt?: string;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShipmentItemDto)
  items!: CreateShipmentItemDto[];
}

