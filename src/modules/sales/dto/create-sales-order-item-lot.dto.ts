import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CreateSalesOrderItemLotDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  inventoryLotId!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantityConsumed!: number;
}

