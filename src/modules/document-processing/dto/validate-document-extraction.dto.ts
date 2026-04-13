import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class ValidatedDocumentExtractionItemDto {
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

export class ValidateDocumentExtractionDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  validatedByUserId!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  supplierId!: number;

  @IsString()
  @MinLength(2)
  orderNumber!: string;

  @IsDateString()
  orderDate!: string;

  @IsOptional()
  @IsString()
  supplierInvoiceNumber?: string;

  @IsOptional()
  @IsDateString()
  supplierInvoiceDate?: string;

  @IsString()
  @MinLength(3)
  currencyCode!: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsDateString()
  estimatedDispatchDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidatedDocumentExtractionItemDto)
  items!: ValidatedDocumentExtractionItemDto[];
}
