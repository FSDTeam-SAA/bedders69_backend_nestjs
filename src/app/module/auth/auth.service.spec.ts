import { HttpException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const buildUserModel = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
});

const buildJwtService = () => ({
  sign: jest.fn().mockReturnValue('signed-token'),
});

const buildResponse = () =>
  ({
    cookie: jest.fn(),
  }) as unknown as Response;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns sanitized user data when registering', async () => {
    const userModel = buildUserModel();
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({
      toObject: () => ({
        _id: 'user-id',
        email: 'carer@example.com',
        role: 'carer',
        status: 'active',
        password: 'hashed-password',
        otp: '123456',
        otpExpiry: new Date(),
        verifiedForget: false,
      }),
    });
    const service = new AuthService(userModel as any, buildJwtService() as any);

    const result = await service.register({
      fullName: 'Care Worker',
      email: 'carer@example.com',
      password: 'secret123',
      role: 'carer',
    } as any);

    expect(result).toMatchObject({
      _id: 'user-id',
      email: 'carer@example.com',
      role: 'carer',
      status: 'active',
    });
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('otp');
    expect(result).not.toHaveProperty('otpExpiry');
    expect(result).not.toHaveProperty('verifiedForget');
  });

  it('blocks suspended users from logging in', async () => {
    const userModel = buildUserModel();
    userModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'user-id',
        email: 'care-company@example.com',
        role: 'care_company',
        status: 'suspended',
        password: 'hashed-password',
      }),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const service = new AuthService(userModel as any, buildJwtService() as any);

    await expect(
      service.login(
        { email: 'care-company@example.com', password: 'secret123' },
        buildResponse(),
      ),
    ).rejects.toMatchObject<HttpException>({
      message: 'Account is not active',
    });
  });

  it('returns tokens and sanitized user data when logging in', async () => {
    const userModel = buildUserModel();
    userModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        toObject: () => ({
          _id: 'user-id',
          email: 'agency@example.com',
          role: 'agency',
          status: 'active',
          password: 'hashed-password',
          otp: '123456',
          verifiedForget: false,
        }),
      }),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const jwtService = buildJwtService();
    const cookieMock = jest.fn();
    const response = {
      cookie: cookieMock,
    } as unknown as Response;
    const service = new AuthService(userModel as any, jwtService as any);

    const result = await service.login(
      { email: 'agency@example.com', password: 'secret123' },
      response,
    );

    expect(result).toMatchObject({
      accessToken: 'signed-token',
      user: {
        _id: 'user-id',
        email: 'agency@example.com',
        role: 'agency',
        status: 'active',
      },
    });
    expect(result.user).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('otp');
    expect(result.user).not.toHaveProperty('verifiedForget');
    expect(cookieMock).toHaveBeenCalledWith(
      'refreshToken',
      'signed-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });
});
