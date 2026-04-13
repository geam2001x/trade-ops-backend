import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { ShipmentStatus } from '../enums/shipment-status.enum';

export class CreateShipmentEventDto {
  @IsString()
  @MinLength(2)
  eventType!: string;

  @IsDateString()
  eventDate!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  shipmentStatus?: ShipmentStatus;
}

