import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';
import { AuthHelper } from './utils/auth-helper';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authHelper: AuthHelper) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let request = context.switchToHttp().getRequest();

    let token = await this.authHelper.request_headers(request);

    try {
      const user = await this.authHelper.decode_token_and_verify_user(token);

      request[`user`] = user;

      return true;
    } catch (error) {
      this.authHelper.get_error_message(error);
    }
  }
}
