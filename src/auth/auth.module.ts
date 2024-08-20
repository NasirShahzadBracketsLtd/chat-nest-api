import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthHelper } from './utils/auth-helper';

import { DoctorsModule } from 'src/doctors/doctors.module';
import { JwtModule } from '@nestjs/jwt';
import { PatientsModule } from 'src/patients/patients.module';
import { AuthGuard } from './auth.guard';
import { WsAuthGuard } from './ws-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key', // Replace with your secret key
      signOptions: { expiresIn: '14d' }, // Replace with your desired expiration time
    }),

    forwardRef(() => PatientsModule),
    forwardRef(() => DoctorsModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthHelper, AuthGuard, WsAuthGuard],
  exports: [AuthService, AuthHelper, AuthGuard, WsAuthGuard, JwtModule],
})
export class AuthModule {}
