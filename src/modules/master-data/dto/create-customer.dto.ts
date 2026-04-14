import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  customerType!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  taxId?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
