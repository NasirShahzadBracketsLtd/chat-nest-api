import { forwardRef, Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Doctor, DoctorSchema } from './entities/doctor.entity';
import { AuthHelper } from 'src/auth/utils/auth-helper';
import { AuthModule } from 'src/auth/auth.module';
import { PatientsModule } from 'src/patients/patients.module';
import { AuthGuard } from 'src/auth/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { AwsElasticCashModule } from 'src/aws-elastic-cash/aws-elastic-cash.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Doctor.name, schema: DoctorSchema }]),

    AwsElasticCashModule,
    forwardRef(() => AuthModule),
    forwardRef(() => PatientsModule),
  ],
  controllers: [DoctorsController],
  providers: [
    DoctorsService,
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthGuard,
    // },
  ],
  exports: [DoctorsService],
})
export class DoctorsModule {}
