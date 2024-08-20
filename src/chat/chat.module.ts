import { forwardRef, Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './entities/chat.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { DoctorsModule } from 'src/doctors/doctors.module';
import { PatientsModule } from 'src/patients/patients.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),

    forwardRef(() => AuthModule),
    forwardRef(() => DoctorsModule),
    forwardRef(() => PatientsModule),
  ],
  providers: [ChatGateway, ChatService, WsAuthGuard],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
