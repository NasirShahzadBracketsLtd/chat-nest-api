import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Doctor, DoctorSchema } from './doctors/entities/doctor.entity';
import { ChatGateway } from './chat/chat.gateway';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { Patient, PatientSchema } from './patients/entities/patient.entity';

import { AwsElasticCashModule } from './aws-elastic-cash/aws-elastic-cash.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forFeature([
      { name: Doctor.name, schema: DoctorSchema },
      { name: Patient.name, schema: PatientSchema },
    ]),

    /** ------------------- Mongodb Connection ------------------- */
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(`MONGODB_CONNECTION`),
      }),
      inject: [ConfigService],
    }),

    DoctorsModule,
    PatientsModule,
    ChatModule,
    AuthModule,
    AwsElasticCashModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
