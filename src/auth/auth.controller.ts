import {
  Controller,
  Post,
  Body,
  Req,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login_doctor')
  @UsePipes(new ValidationPipe())
  login_doctor(@Body() loginDTO: LoginDTO) {
    return this.authService.login_doctor(loginDTO);
  }

  @Post('login_patient')
  @UsePipes(new ValidationPipe())
  login_patient(@Body() loginDTO: LoginDTO) {
    return this.authService.login_patient(loginDTO);
  }

  @Post()
  logout(@Req() req: any) {
    return this.authService.logout(req);
  }
}
