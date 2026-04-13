import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { SalesOrderStatus } from '../enums/sales-order-status.enum';

export class UpdateSalesOrderStatusDto {
  @IsEnum(SalesOrderStatus)
  status!: SalesOrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  changedByUserId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
