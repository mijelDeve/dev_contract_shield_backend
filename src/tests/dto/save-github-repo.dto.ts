import { IsNotEmpty, IsString } from 'class-validator';

export class SaveGithubRepoDto {
  @IsString()
  @IsNotEmpty()
  githubRepoUrl: string;
}
