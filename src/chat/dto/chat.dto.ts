import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class ChatDto {
  @IsNotEmpty()
  @IsString()
  _sender_id: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  _receiver_id: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  content: string;
}
