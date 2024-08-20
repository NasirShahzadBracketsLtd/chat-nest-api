import { forwardRef, Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Patient, PatientSchema } from './entities/patient.entity';
import { DoctorsModule } from 'src/doctors/doctors.module';
import { DoctorsService } from 'src/doctors/doctors.service';
import { AuthHelper } from 'src/auth/utils/auth-helper';
import { AuthModule } from 'src/auth/auth.module';
import { AuthGuard } from 'src/auth/auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Patient.name, schema: PatientSchema }]),

    forwardRef(() => AuthModule),
    forwardRef(() => DoctorsModule),
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
