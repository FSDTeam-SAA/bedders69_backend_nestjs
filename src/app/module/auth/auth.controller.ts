import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  CreateAuthDto,
  ForgotPasswordDto,
  LoginAuthDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/create-auth.dto';
import type { Request, Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { USER_ROLES } from '../user/entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register user',
    description: 'Creates a new user account and returns sanitized user data.',
  })
  @ApiBody({ type: CreateAuthDto })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        message: 'User registered successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          fullName: 'Saurav Sarkar',
          email: 'saurav@example.com',
          role: 'family',
          status: 'active',
        },
      },
    },
  })
  @ApiConflictResponse({ description: 'User already exists' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() CreateAuthDto: CreateAuthDto) {
    const result = await this.authService.register(CreateAuthDto);

    return {
      message: 'User registered successfully',
      data: result,
    };
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login user',
    description:
      'Authenticates an active user, sets a refresh-token cookie, and returns an access token.',
  })
  @ApiBody({ type: LoginAuthDto })
  @ApiOkResponse({
    description: 'User logged in successfully',
    schema: {
      example: {
        success: true,
        message: 'User logged in successfully',
        data: {
          accessToken: 'jwt-access-token',
          user: {
            _id: '65f1c9f234df3c9342a58f00',
            email: 'saurav@example.com',
            role: 'family',
            status: 'active',
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Incorrect password' })
  @ApiBadRequestResponse({ description: 'Account is not active' })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() createAuthDto: LoginAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(createAuthDto, res);

    return {
      message: 'User logged in successfully',
      data: result,
    };
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Send password reset OTP',
    description: 'Sends a password reset OTP to the user email address.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({
    description: 'Email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Email sent successfully',
        data: {
          message: 'Check your email for OTP',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() createAuthDto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(createAuthDto.email);

    return {
      message: 'Email sent successfully',
      data: result,
    };
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verify password reset OTP',
    description: 'Verifies the OTP sent to the user email address.',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiOkResponse({
    description: 'Email verified successfully',
    schema: {
      example: {
        success: true,
        message: 'Email verified successfully',
        data: {
          message: 'OTP verified successfully',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid or expired OTP' })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() createAuthDto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(
      createAuthDto.email,
      createAuthDto.otp,
    );
    return {
      message: 'Email verified successfully',
      data: result,
    };
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets password after successful OTP verification.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({
    description: 'Password changed successfully',
    schema: {
      example: {
        success: true,
        message: 'Password changed successfully',
        data: {
          message: 'Password reset successfully',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid reset request' })
  @HttpCode(HttpStatus.OK)
  async resetPasswordChange(@Body() CreateAuthDto: ResetPasswordDto) {
    const result = await this.authService.resetPasswordChange(
      CreateAuthDto.email,
      CreateAuthDto.newPassword,
    );
    return {
      message: 'Password changed successfully',
      data: result,
    };
  }

  @Post('change-password')
  @UseGuards(AuthGuard(...USER_ROLES))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Change password',
    description: 'Changes the password for an authenticated active user.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({
    description: 'Password changed successfully',
    schema: {
      example: {
        success: true,
        message: 'Password changed successfully',
        data: {
          message: 'Password changed successfully',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Invalid old password' })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() CreateAuthDto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const result = await this.authService.changePassword(
      req.user!.id,
      CreateAuthDto.oldPassword,
      CreateAuthDto.newPassword,
    );
    return {
      message: 'Password changed successfully',
      data: result,
    };
  }
}
