import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  fullName?: string;

  @IsString()
  @MaxLength(66)
  @IsOptional()
  @Matches(/^0x[a-fA-F0-9]+$/, {
    message: 'Wallet address must be a valid EVM address (0x...)',
  })
  walletAddress?: string;

  @IsBoolean()
  @IsOptional()
  isDeveloper?: boolean;
}
