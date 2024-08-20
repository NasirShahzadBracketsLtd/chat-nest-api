import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { GENDER_ENUM, ROLE_ENUM } from '../utility/enum';

@Schema({ _id: true, timestamps: true, collection: 'doctors' })
export class Doctor {
  @Prop({ type: String })
  firstName: string;

  @Prop({ type: String })
  lastName: string;

  @Prop({ type: String, unique: true })
  email: string;

  @Prop({ type: String })
  password: string;

  @Prop({ type: String, enum: Object.values(GENDER_ENUM) })
  gender: string;

  @Prop({ type: String, enum: Object.values(ROLE_ENUM) })
  role: string;

  @Prop({ type: String })
  token: string;

  @Prop({ type: Boolean })
  isOnline: boolean;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
