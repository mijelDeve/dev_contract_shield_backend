import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateContractDto {
  @IsString()
  title: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  startDate: string;

  @IsString()
  dueDate: string;

  @IsBoolean()
  isGithubProject: boolean;
}
