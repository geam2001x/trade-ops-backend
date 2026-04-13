import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePurchaseOrderFromDocumentExtractionDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  createdByUserId!: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
