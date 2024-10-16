import { SignupDto } from './dto/signup-dto';
import { BadRequestException, Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from '@/common/decorators/public.decorator';
import { LoginDto } from './dto/login-with-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiResponses } from '@/utils/response.util';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotAcceptableResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TokenService } from './token/token.service';
import { OtpService } from './otp/otp.service';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
  ) {}

@ApiCreatedResponse({ description: 'Login successful' })
@ApiUnauthorizedResponse({ description: 'Invalid credentials' })
@Public()
@Post('login')
async login(
  @Body() { email_or_phone, password }: { email_or_phone: string; password: string }
){
  return await this.authService.login(email_or_phone, password);
}


  @ApiCreatedResponse({ description: 'Username accepted' })
  @ApiConflictResponse({ description: 'Username already exists' })
  @Public()
  @Post('signup/username')
  async checkUsername(
    @Body() { username }: { username: string }
  ){
    return await this.authService.checkUserNameAvailability(username);
  }

  @ApiCreatedResponse({ description: 'Verification code sent' })
  @ApiConflictResponse({ description: 'Invalid email or phone number' })
  @Public()
  @Post('signup/request-code')
  async requestVerificationCode(
  @Body() { email_or_phone }: { email_or_phone: string }
  ){
    return await this.authService.sendOTPToPhoneOrEmail(email_or_phone)
  }

  @ApiCreatedResponse({ description: 'Code verified successfully' })
  @ApiConflictResponse({ description: 'Invalid verification code' })
  @Public()
  @Post('signup/verify-code')
  async verifyCode(
  @Body() { email_or_phone, verification_code }: { email_or_phone: string; verification_code: string }
  ) {
  return await this.authService.verifyCode(email_or_phone, verification_code);
  }

  @ApiCreatedResponse({ description: 'Password set successfully' })
  @ApiConflictResponse({ description: 'Passwords do not match' })
  @Public()
  @Post('signup/set-password')
  async setPassword(
  @Body() { email_or_phone, password, confirm_password }: { email_or_phone: string; password: string; confirm_password: string }
  ){
  return await this.authService.setPassword(email_or_phone, password, confirm_password);
  }

  @ApiCreatedResponse({ description: 'Verification code sent' })
  @ApiBadRequestResponse({ description: 'User not found' })
  @Public()
  @Post('password/forgot')
  async forgotPassword(
    @Body() { email_or_phone_or_username }: { email_or_phone_or_username: string }
  ){
  return await this.authService.forgotPassword(email_or_phone_or_username);
  }

  @ApiCreatedResponse({ description: 'Code verified' })
  @ApiBadRequestResponse({ description: 'Invalid verification code' })
  @Public()
  @Post('password/verify-code')
  async verifyForgotPasswordCode(
  @Body() { email_or_phone_or_username, verification_code }: { email_or_phone_or_username: string; verification_code: string }
  ) {
  const result = await this.authService.verifyForgotPasswordCode(email_or_phone_or_username, verification_code);
  return result;
  } 

  @ApiCreatedResponse({ description: 'Password reset successfully' })
  @ApiBadRequestResponse({ description: 'Passwords do not match' })
  @Public()
  @Post('password/reset')
  async resetPassword(
  @Body() { password, confirm_password, userId }: { password: string; confirm_password: string; userId: number }
  ){
  return await this.authService.resetPassword(password, confirm_password, userId);
  }




}
