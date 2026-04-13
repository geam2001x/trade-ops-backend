import { IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CreateDocumentUploadDto {
  @IsString()
  @MinLength(2)
  documentType!: string;

  @IsString()
  @MinLength(2)
  originalFileName!: string;

  @IsString()
  @MinLength(2)
  storagePath!: string;

  @IsString()
  @MinLength(3)
  mimeType!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  uploadedByUserId!: number;

  @IsOptional()
  @IsString()
  status?: string;
}
