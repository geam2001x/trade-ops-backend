import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CreateShipmentItemDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  purchaseOrderItemId!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  productId!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantityShipped!: number;
}

