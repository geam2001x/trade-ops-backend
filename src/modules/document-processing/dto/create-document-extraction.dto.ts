import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { CreateDocumentExtractionItemDto } from './create-document-extraction-item.dto';

export class CreateDocumentExtractionDto {
  @IsString()
  detectedDocumentType!: string;

  @IsOptional()
  @IsString()
  rawText?: string;

  @IsOptional()
  @IsObject()
  structuredPayloadJson?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  confidenceScore?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentExtractionItemDto)
  items!: CreateDocumentExtractionItemDto[];
}
