import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class ImportExpenseAllocationLineDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  inventoryLotId!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  allocatedAmountUsd!: number;
}

export class AllocateImportExpenseDto {
  @IsString()
  @MinLength(2)
  allocationMethod!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportExpenseAllocationLineDto)
  allocations!: ImportExpenseAllocationLineDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
