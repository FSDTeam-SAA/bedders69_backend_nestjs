import { HttpException, Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { User, UserDocument } from '../user/entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from '@nestjs/jwt';
import config from '../../config';
import sendMailer from 'src/app/helpers/sendMailer';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: jwt.JwtService,
  ) {}

  private sanitizeUser(user: unknown): Record<string, unknown> {
    const maybeDocument = user as {
      toObject?: () => Record<string, unknown>;
    };
    const plainUser =
      typeof maybeDocument?.toObject === 'function'
        ? maybeDocument.toObject()
        : user;

    if (!plainUser || typeof plainUser !== 'object') {
      return {};
    }

    const safeUser = { ...(plainUser as Record<string, unknown>) };
    delete safeUser.password;
    delete safeUser.otp;
    delete safeUser.otpExpiry;
    delete safeUser.verifiedForget;
    delete safeUser.__v;

    return safeUser;
  }

  private buildTokenPayload(user: {
    _id?: unknown;
    id?: unknown;
    email?: string;
    role?: string;
    status?: string;
  }) {
    return {
      id: String(user._id ?? user.id),
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
    });
  }

  async register(CreateAuthDto: CreateAuthDto) {
    const user = await this.userModel.findOne({ email: CreateAuthDto.email });
    if (user) {
      throw new HttpException('User already exists', 400);
    }
    const newUser = await this.userModel.create({
      ...CreateAuthDto,
      status: 'active',
    });
    return this.sanitizeUser(newUser);
  }

  async login(loginDto: { email: string; password: string }, res: Response) {
    const user = await this.userModel
      .findOne({ email: loginDto.email })
      .select('+password');
    if (!user) {
      throw new HttpException('User not found', 404);
    }

    const isPasswordMatch = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new HttpException('Incorrect password', 401);
    }

    const safeUser = this.sanitizeUser(user);
    const status = user.status ?? safeUser?.status;
    if (status !== 'active') {
      throw new HttpException('Account is not active', 403);
    }

    const tokenPayload = this.buildTokenPayload({
      _id: user._id ?? safeUser?._id,
      email: user.email ?? (safeUser?.email as string | undefined),
      role: user.role ?? (safeUser?.role as string | undefined),
      status: status as string | undefined,
    });

    const accessToken = this.jwtService.sign(
      tokenPayload,
      {
        secret: config.jwt.accessTokenSecret,
        expiresIn: config.jwt.accessTokenExpires as any,
      } as jwt.JwtSignOptions,
    );
    const refreshToken = this.jwtService.sign(
      tokenPayload,
      {
        secret: config.jwt.refreshTokenSecret,
        expiresIn: config.jwt.refreshTokenExpires as any,
      } as jwt.JwtSignOptions,
    );
    this.setRefreshTokenCookie(res, refreshToken);

    return { accessToken, user: safeUser };
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken) {
      throw new HttpException('Refresh token missing', 401);
    }

    const decoded = this.jwtService.verify<{
      id: string;
      email: string;
      role: string;
      status?: string;
    }>(refreshToken, {
      secret: config.jwt.refreshTokenSecret,
    });

    const user = await this.userModel.findById(decoded.id);
    if (!user) throw new HttpException('User not found', 404);
    if (user.status !== 'active') {
      throw new HttpException('Account is not active', 403);
    }

    const tokenPayload = this.buildTokenPayload(user);
    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: config.jwt.accessTokenSecret,
      expiresIn: config.jwt.accessTokenExpires as any,
    } as jwt.JwtSignOptions);
    const nextRefreshToken = this.jwtService.sign(tokenPayload, {
      secret: config.jwt.refreshTokenSecret,
      expiresIn: config.jwt.refreshTokenExpires as any,
    } as jwt.JwtSignOptions);
    this.setRefreshTokenCookie(res, nextRefreshToken);

    return { accessToken, user: this.sanitizeUser(user) };
  }

  logout(res: Response) {
    this.clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new HttpException('Email not found', 404);

    const generateOtpNumber = Math.floor(100000 + Math.random() * 900000);

    user.otp = generateOtpNumber.toString();
    user.otpExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const html = `
    <div style="font-family: Arial; text-align: center;">
      <h2 style="color:#4f46e5;">Password Reset OTP</h2>
      <p>Your OTP code is:</p>
      <h1 style="letter-spacing:4px;">${generateOtpNumber}</h1>
      <p>This code will expire in 1 hour.</p>
    </div>
  `;

    await sendMailer(user.email, 'Reset Password OTP', html);

    return { message: 'Check your email for OTP' };
  }

  async sendVerificationOtp(email: string) {
    const user = await this.userModel.findOne({ email });
    const generateOtpNumber = Math.floor(100000 + Math.random() * 900000);

    if (user) {
      user.otp = generateOtpNumber.toString();
      user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
    }

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #0e7490; text-align: center; margin-bottom: 8px;">Bedders Care Platform</h2>
      <p style="color: #475569; text-align: center; font-size: 16px;">Use the following One-Time Password (OTP) to verify your email address:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; padding: 12px 24px; background: #f0fdfa; border: 2px dashed #0e7490; border-radius: 8px;">
          ${generateOtpNumber}
        </span>
      </div>
      <p style="color: #64748b; font-size: 14px; text-align: center;">This OTP is valid for 15 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

    try {
      await sendMailer(email, 'Bedders - Email Verification OTP', html);
    } catch (err) {
      console.error('Failed to send mail:', err);
    }

    return { message: 'OTP sent to your email successfully' };
  }

  async verifyEmail(email: string, otp: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new HttpException('User not found', 404);

    if (user.otp && user.otp !== otp) throw new HttpException('Invalid OTP', 400);
    if (user.otpExpiry && user.otpExpiry < new Date()) throw new HttpException('OTP expired', 400);

    user.otp = undefined as any;
    user.otpExpiry = undefined as any;
    user.status = 'active';
    user.verifiedForget = true;
    await user.save();

    return { message: 'OTP verified successfully' };
  }

  async resetPasswordChange(email: string, newPassword: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new HttpException('Invalid link', 400);

    if (!user.verifiedForget) throw new HttpException('Invalid link', 400);

    user.password = newPassword;
    user.verifiedForget = false;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new HttpException('User not found', 404);
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) throw new HttpException('Invalid old password', 400);

    if (oldPassword === newPassword)
      throw new HttpException(
        'New password cannot be same as old password',
        400,
      );

    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }
}
