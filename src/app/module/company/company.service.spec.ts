import { HttpException } from '@nestjs/common';
import { CompanyService } from './company.service';

const buildCompanyModel = () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
});

const buildUserModel = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
});

describe('CompanyService', () => {
  it('gets the authenticated company profile by user id', async () => {
    const userModel = buildUserModel();
    const companyModel = buildCompanyModel();
    companyModel.findOne.mockResolvedValue({
      _id: 'company-id',
      userId: 'user-id',
      email: 'company@example.com',
    });
    const service = new CompanyService(userModel as any, companyModel as any);

    const result = await service.getMyProfile('user-id');

    expect(companyModel.findOne).toHaveBeenCalledWith({ userId: 'user-id' });
    expect(result).toMatchObject({
      _id: 'company-id',
      userId: 'user-id',
      email: 'company@example.com',
    });
  });

  it('throws not found when authenticated company profile is missing', async () => {
    const userModel = buildUserModel();
    const companyModel = buildCompanyModel();
    companyModel.findOne.mockResolvedValue(null);
    const service = new CompanyService(userModel as any, companyModel as any);

    await expect(service.getMyProfile('missing-user-id')).rejects.toMatchObject(
      {
        message: 'Care company profile not found',
        status: 404,
      },
    );
  });

  it('updates the authenticated company profile and linked user metadata', async () => {
    const userModel = buildUserModel();
    const companyModel = buildCompanyModel();
    companyModel.findOne.mockResolvedValue({
      _id: 'company-id',
      userId: 'user-id',
      email: 'company@example.com',
    });
    companyModel.findOneAndUpdate.mockResolvedValue({
      _id: 'company-id',
      userId: 'user-id',
      companyName: 'Updated Care Ltd',
      phoneNumber: '+447700900999',
      address: 'New Address',
    });
    const service = new CompanyService(userModel as any, companyModel as any);

    const result = await service.updateMyProfile('user-id', {
      companyName: 'Updated Care Ltd',
      phoneNumber: '+447700900999',
      address: 'New Address',
    });

    expect(companyModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-id' },
      expect.objectContaining({
        companyName: 'Updated Care Ltd',
      }),
      { new: true },
    );
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('user-id', {
      fullName: 'Updated Care Ltd',
      phoneNumber: '+447700900999',
      address: 'New Address',
    });
    expect(result).toMatchObject({
      _id: 'company-id',
      userId: 'user-id',
      companyName: 'Updated Care Ltd',
    });
  });

  it('creates a linked company user with basic profile metadata', async () => {
    const userModel = buildUserModel();
    const companyModel = buildCompanyModel();
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({ _id: 'new-user-id' });
    companyModel.create.mockResolvedValue({
      _id: 'company-id',
      userId: 'new-user-id',
      email: 'company@example.com',
    });
    const service = new CompanyService(userModel as any, companyModel as any);

    const result = await service.createCompany({
      companyName: 'Bedders Care Ltd',
      email: 'company@example.com',
      password: 'secret123',
      phoneNumber: '+447700900123',
      registerNumber: 'REG-123',
      address: '221B Baker Street',
      location: {
        type: 'Point',
        coordinates: [-0.1278, 51.5074],
      },
      postCode: 'SW1A 1AA',
    });

    expect(userModel.create).toHaveBeenCalledWith({
      email: 'company@example.com',
      role: 'care_company',
      password: 'secret123',
      fullName: 'Bedders Care Ltd',
      phoneNumber: '+447700900123',
      address: '221B Baker Street',
    });
    expect(companyModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'new-user-id',
        email: 'company@example.com',
      }),
    );
    expect(result).toMatchObject({
      _id: 'company-id',
      userId: 'new-user-id',
      email: 'company@example.com',
    });
  });

  it('rejects duplicate company emails with a bad request exception', async () => {
    const userModel = buildUserModel();
    const companyModel = buildCompanyModel();
    userModel.findOne.mockResolvedValue({ _id: 'existing-user-id' });
    const service = new CompanyService(userModel as any, companyModel as any);

    await expect(
      service.createCompany({
        companyName: 'Bedders Care Ltd',
        email: 'company@example.com',
        password: 'secret123',
        phoneNumber: '+447700900123',
        registerNumber: 'REG-123',
        address: 'London',
        location: {
          type: 'Point',
          coordinates: [-0.1278, 51.5074],
        },
        postCode: 'SW1A 1AA',
      }),
    ).rejects.toMatchObject<HttpException>({
      message: 'User already exists',
      status: 400,
    });
    expect(companyModel.create).not.toHaveBeenCalled();
  });
});
