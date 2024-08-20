import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: true, timestamps: true, collection: 'chats' })
export class Chat {
  @Prop({ type: Types.ObjectId, required: true })
  _sender_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  _receiver_id: Types.ObjectId;

  @Prop({ type: String })
  content: string;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
