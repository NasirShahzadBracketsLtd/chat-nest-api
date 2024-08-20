import { JwtService } from '@nestjs/jwt';
import { PatientsService } from './../patients/patients.service';
import { DoctorsService } from 'src/doctors/doctors.service';
import { AuthHelper } from './utils/auth-helper';
import { Model, Types } from 'mongoose';
import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { LoginDTO } from './dto/login.dto';
import { ROLE_ENUM } from 'src/doctors/utility/enum';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => DoctorsService))
    private readonly doctorsService: DoctorsService,

    @Inject(forwardRef(() => PatientsService))
    private readonly patientsService: PatientsService,

    @Inject(forwardRef(() => AuthHelper))
    private readonly authHelper: AuthHelper,
    private readonly jwtService: JwtService,
  ) {}

  async login_doctor(loginDto: LoginDTO) {
    try {
      const { email, password } = loginDto;

      const found = await this.doctorsService.find_doctor_by_email(email);

      if (!found) {
        throw new UnauthorizedException(`Invalid Credentials!!`);
      }

      /**
       * Validate Password and Return Token
       */

      const token = await this.validate_password_and_return_token(
        password,
        found,
      );

      return { token };
    } catch (error) {
      throw new UnauthorizedException(`Invalid Credentials!!`);
    }
  }

  async login_patient(loginDto: LoginDTO) {
    try {
      const { email, password } = loginDto;

      const found = await this.patientsService.find_patient_by_email(email);

      if (!found) {
        throw new UnauthorizedException(`Invalid Credentials!!`);
      }

      /**
       * Validate Password and Return Token
       */
      const token = await this.validate_password_and_return_token(
        password,
        found,
      );

      return { token };
    } catch (error) {
      throw new UnauthorizedException(`Invalid Credentials!!`);
    }
  }

  async validate_password_and_return_token(
    given_password: string,
    found_user: any,
  ) {
    /**
     * Match Password
     */
    const match_password = await bcrypt.compare(
      given_password,
      found_user?.password,
    );

    if (!match_password) {
      throw new UnauthorizedException(`Invalid Credentials!!`);
    }

    /**
     * Create Payload
     * Create Token
     */

    const { _id, role } = found_user;
    const payload: any = { _id, role };

    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: `14d`,
    });

    return token;
  }

  async validate_user(payload: any) {
    try {
      const { role, _id } = payload;

      const user =
        role === ROLE_ENUM.DOCTOR
          ? await this.doctorsService.findOne(_id)
          : await this.patientsService.findOne(_id);

      return user;
    } catch (error) {
      throw error;
    }
  }

  async logout(req: any) {
    try {
      const { _id } = req?.user;

      req?.role === ROLE_ENUM.DOCTOR
        ? await this.doctorsService.remove_token(_id)
        : await this.patientsService.remove_token(_id);
    } catch (error) {
      throw error;
    }
  }
}
