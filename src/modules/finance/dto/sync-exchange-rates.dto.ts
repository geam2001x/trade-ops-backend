import { IsDateString, IsOptional, IsString } from 'class-validator';

export class SyncExchangeRatesDto {
  @IsOptional()
  @IsString()
  baseCurrencyCode?: string;

  @IsOptional()
  @IsString()
  quoteCurrencyCode?: string;

  @IsOptional()
  @IsDateString()
  firstDate?: string;

  @IsOptional()
  @IsDateString()
  lastDate?: string;
}
