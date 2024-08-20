import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { GENDER_ENUM, ROLE_ENUM } from '../utility/enum';

export class CreateDoctorDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(GENDER_ENUM)
  gender: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(ROLE_ENUM)
  role: string;
}
