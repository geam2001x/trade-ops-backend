import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDocumentExtractionItemDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lineIndex!: number;

  @IsString()
  @MinLength(2)
  productDescription!: string;

  @IsOptional()
  @IsString()
  skuDetected?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @IsOptional()
  @IsString()
  unitMeasure?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lineTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  confidenceScore?: number;
}
