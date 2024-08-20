import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ROLE_ENUM } from 'src/doctors/utility/enum';

@Schema({ _id: true, timestamps: true, collection: 'patients' })
export class Patient {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String, unique: true })
  email: string;

  @Prop({ type: String })
  password: string;

  @Prop({ type: String })
  disease: string;

  @Prop({ type: Types.ObjectId, ref: 'doctors', required: true })
  _doctor_id: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ROLE_ENUM) })
  role: string;

  @Prop({ type: String })
  token?: string;

  @Prop({ type: Boolean })
  isOnline?: boolean;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
