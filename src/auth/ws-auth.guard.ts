import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { Socket } from 'socket.io';
import { AuthHelper } from './utils/auth-helper';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly authHelper: AuthHelper) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    let token = await this.authHelper.client_headers(client);

    try {
      const user = await this.authHelper.decode_token_and_verify_user(token);

      client[`user`] = user;

      return true;
    } catch (error) {
      this.authHelper.get_error_message(error);
    }
  }
}
