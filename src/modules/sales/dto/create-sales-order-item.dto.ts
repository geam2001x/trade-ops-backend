import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { CreateSalesOrderItemLotDto } from './create-sales-order-item-lot.dto';

export class CreateSalesOrderItemDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  productId!: number;

  @IsString()
  @MinLength(2)
  productDescriptionSnapshot!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPriceOriginal!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPriceUsd!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lineTotalOriginal!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lineTotalUsd!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemLotDto)
  lots!: CreateSalesOrderItemLotDto[];
}

