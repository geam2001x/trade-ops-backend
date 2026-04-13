import { Type } from 'class-transformer';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreatePurchaseOrderItemDto {
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
  quantityOrdered!: number;

  @IsString()
  @MinLength(1)
  unitMeasure!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPriceOriginal!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.000001)
  exchangeRateToUsd!: number;

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
}
