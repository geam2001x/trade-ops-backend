import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AdvancePurchaseOrderCheckpointDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  changedByUserId!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
