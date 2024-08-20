import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreatePatientDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  disease: string;

  @IsNotEmpty()
  @IsString()
  _doctor_id: Types.ObjectId;
}
