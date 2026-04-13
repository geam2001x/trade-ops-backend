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

import { CreatePurchaseOrderItemDto } from './create-purchase-order-item.dto';

export class CreatePurchaseOrderDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  supplierId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  purchaseQuotationId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  proformaDocumentUploadId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  invoiceDocumentUploadId?: number;

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

  @IsOptional()
  @IsString()
  status?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  createdByUserId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items!: CreatePurchaseOrderItemDto[];
}
