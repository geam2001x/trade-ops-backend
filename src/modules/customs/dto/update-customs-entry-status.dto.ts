import { IsEnum, IsOptional, IsString } from 'class-validator';

import { CustomsEntryStatus } from '../enums/customs-entry-status.enum';

export class UpdateCustomsEntryStatusDto {
  @IsEnum(CustomsEntryStatus)
  status!: CustomsEntryStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

