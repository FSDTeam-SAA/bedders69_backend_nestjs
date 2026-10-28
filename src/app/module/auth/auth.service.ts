import { HttpException, Injectable, Optional } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { User, UserDocument, UserStatus } from '../user/entities/user.entity';
import { Care, CareDocument } from '../care/entities/care.entity';
import { Company, CompanyDocument } from '../company/entities/company.entity';
import { Agency, AgencyDocument } from '../agency/entities/agency.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from '@nestjs/jwt';
import config from '../../config';
import sendMailer from 'src/app/helpers/sendMailer';
import { generateOtpEmailTemplate } from 'src/app/helpers/emailTemplates';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: jwt.JwtService,
    @Optional()
    @InjectModel(Care.name)
    private readonly careModel?: Model<CareDocument>,
    @Optional()
    @InjectModel(Company.name)
    private readonly companyModel?: Model<CompanyDocument>,
    @Optional()
    @InjectModel(Agency.name)
    private readonly agencyModel?: Model<AgencyDocument>,
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
    const defaultStatus: UserStatus =
      (CreateAuthDto.status as UserStatus) ||
      (CreateAuthDto.role === 'admin' || CreateAuthDto.role === 'family'
        ? 'active'
        : 'pending');

    const newUser = await this.userModel.create({
      ...CreateAuthDto,
      status: defaultStatus,
    });

    try {
      if (this.careModel && newUser.role === 'carer') {
        const nameParts = (newUser.fullName || '').trim().split(/\s+/);
        const firstName =
          CreateAuthDto.firstName ||
          (newUser as any).firstName ||
          nameParts[0] ||
          '';
        const lastName =
          CreateAuthDto.lastName ||
          (newUser as any).lastName ||
          nameParts.slice(1).join(' ') ||
          '';
        const careName =
          newUser.fullName ||
          `${firstName} ${lastName}`.trim() ||
          'Carer Name';

        await this.careModel.create({
          userId: newUser._id,
          careName,
          firstName,
          lastName,
          fullName: careName,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber || '',
          address: newUser.address || '',
          postCode: (newUser as any).postCode || '',
          country: (newUser as any).country || 'United Kingdom',
          region: (newUser as any).city || '',
          profileCompletionPercentage: 0,
          profileCompletionStatus: 'incomplete',
        });
      } else if (this.companyModel && newUser.role === 'care_company') {
        const baseName = (newUser.fullName || '').trim() || 'Care Company';
        const existingWithName = await this.companyModel.findOne({
          companyName: baseName,
        });
        const companyName = existingWithName
          ? `${baseName} (${String(newUser._id).slice(-4)})`
          : baseName;

        const regNum =
          CreateAuthDto.registerNumber ||
          CreateAuthDto.registrationNumber ||
          (newUser as any).registerNumber ||
          '';
        const web =
          CreateAuthDto.websiteLink ||
          CreateAuthDto.website ||
          (newUser as any).website ||
          '';

        const logo =
          CreateAuthDto.logoUrl || CreateAuthDto.logo || '';
        const banner =
          CreateAuthDto.bannerUrl || CreateAuthDto.coverPhoto || '';

        await this.companyModel.create({
          userId: newUser._id,
          companyName,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber || '',
          address: newUser.address || '',
          postCode: (newUser as any).postCode || '',
          registerNumber: regNum,
          websiteLink: web,
          logo: logo,
          coverPhoto: banner,
          profileCompletionPercentage: 0,
          profileCompletionStatus: 'incomplete',
          status: 'pending',
        });

        if (logo) {
          await this.userModel.findByIdAndUpdate(newUser._id, {
            profilePicture: logo,
          });
        }
      } else if (this.agencyModel && newUser.role === 'agency') {
        const regNum =
          CreateAuthDto.registerNumber ||
          CreateAuthDto.registrationNumber ||
          (newUser as any).registerNumber ||
          '';
        const web =
          CreateAuthDto.website ||
          CreateAuthDto.websiteLink ||
          (newUser as any).website ||
          '';
        const logo =
          CreateAuthDto.logoUrl || CreateAuthDto.logo || '';
        const banner =
          CreateAuthDto.bannerUrl || CreateAuthDto.coverPhoto || '';

        await this.agencyModel.create({
          userId: newUser._id,
          name: newUser.fullName || 'Agency Name',
          email: newUser.email,
          phoneNumber: newUser.phoneNumber || '',
          registerNumber: regNum,
          website: web,
          discription: '',
          address: newUser.address || '',
          logoUrl: logo,
          bannerUrl: banner,
          specialisations: [],
          documents: [],
          profileCompletionPercentage: 0,
          profileCompletionStatus: 'incomplete',
        });

        if (logo) {
          await this.userModel.findByIdAndUpdate(newUser._id, {
            profilePicture: logo,
          });
        }
      }
    } catch (profileError) {
      console.error(
        'Warning: Pre-provisioning profile during registration encountered an issue:',
        profileError,
      );
    }

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
    if (status === 'suspended' || status === 'rejected') {
      throw new HttpException(`Account is ${status}`, 403);
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

    const html = generateOtpEmailTemplate({
      title: 'Password Reset Request',
      description:
        'We received a request to reset the password for your The Care Directory account. Use the following One-Time Password (OTP) to proceed with updating your credentials:',
      otp: generateOtpNumber.toString(),
      expiryMinutes: 60,
      note: 'If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.',
    });

    await sendMailer(
      user.email,
      'The Care Directory - Password Reset OTP',
      html,
    );

    return { message: 'Check your email for OTP' };
  }

  async sendVerificationOtp(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) {
      throw new HttpException('User not found', 404);
    }

    const generateOtpNumber = Math.floor(100000 + Math.random() * 900000);
    user.otp = generateOtpNumber.toString();
    user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const html = generateOtpEmailTemplate({
      title: 'Verify Your Email Address',
      description:
        'Welcome to The Care Directory! Use the following One-Time Password (OTP) to verify your email address and activate your account:',
      otp: generateOtpNumber.toString(),
      expiryMinutes: 15,
      note: 'If you did not create an account on The Care Directory, please ignore this email.',
    });

    try {
      await sendMailer(
        normalizedEmail,
        'The Care Directory - Email Verification OTP',
        html,
      );
    } catch (err) {
      console.error('Failed to send mail:', err);
    }

    return { message: 'OTP sent to your email successfully' };
  }

  async verifyEmail(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = String(otp ?? '').trim();
    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) throw new HttpException('User not found', 404);

    if (!user.otp || !user.otpExpiry || user.otp !== normalizedOtp) {
      throw new HttpException('Invalid OTP', 400);
    }
    if (user.otpExpiry < new Date()) {
      throw new HttpException('OTP expired', 400);
    }

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
