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

import { CreateSalesOrderItemDto } from './create-sales-order-item.dto';
import { SaleType } from '../enums/sale-type.enum';
import { SalesOrderStatus } from '../enums/sales-order-status.enum';

export class CreateSalesOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  customerId?: number;

  @IsEnum(SaleType)
  saleType!: SaleType;

  @IsString()
  @MinLength(2)
  orderNumber!: string;

  @IsDateString()
  orderDate!: string;

  @IsString()
  @MinLength(3)
  currencyCode!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.000001)
  exchangeRateToUsd!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalOriginal!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalUsd!: number;

  @IsEnum(SalesOrderStatus)
  status!: SalesOrderStatus;

  @IsOptional()
  @IsString()
  customerNameSnapshot?: string;

  @IsOptional()
  @IsString()
  customerTaxIdSnapshot?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  createdByUserId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemDto)
  items!: CreateSalesOrderItemDto[];
}

