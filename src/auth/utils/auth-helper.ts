import * as bcrypt from 'bcryptjs';

import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ROLE_ENUM } from 'src/doctors/utility/enum';

import { JwtService } from '@nestjs/jwt';
import { PatientsService } from 'src/patients/patients.service';
import { DoctorsService } from 'src/doctors/doctors.service';
import { Socket } from 'socket.io';
import { Request } from 'express';

@Injectable()
export class AuthHelper {
  constructor(
    private readonly jwtService: JwtService,

    @Inject(forwardRef(() => PatientsService))
    private readonly patientsService: PatientsService,

    @Inject(forwardRef(() => DoctorsService))
    private readonly doctorsService: DoctorsService,
  ) {}

  async hash_password(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw error;
    }
  }

  async extract_token_from_headers(headers: string): Promise<string> {
    const [type, token] = headers.split(' ');

    if (type !== `Bearer` || !token) {
      throw new UnauthorizedException(`Invalid Token`);
    }

    return token;
  }

  async client_headers(client: Socket): Promise<string> {
    let token = client.handshake?.headers?.authorization;

    if (!token) {
      throw new UnauthorizedException(`Missing authorization header.`);
    }
    return await this.extract_token_from_headers(token);
  }

  async request_headers(request: Request): Promise<string> {
    let authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(`Missing authorization header.`);
    }

    const token = await this.extract_token_from_headers(authHeader);

    return token;
  }

  async decode_token_and_verify_user(token: string): Promise<any> {
    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const { role, _id } = decoded;

      const user =
        role === ROLE_ENUM.DOCTOR
          ? await this.doctorsService.findOne(_id)
          : await this.patientsService.findOne(_id);

      if (!user) {
        throw new UnauthorizedException(`You're not authorized!!`);
      }

      return user;
    } catch (error) {
      console.error(`Error in decode_token_and_verify_user:`, error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  get_error_message(error: any): string {
    switch (error.name) {
      case `TokenExpiredError`:
        return `Token has expired.`;
      case `JsonWebTokenError`:
        return `Invalid token.`;
      default:
        return `Unable to authenticate request.`;
    }
  }
}
