import { HttpException } from '@nestjs/common';
import { CompanyService } from './company.service';

const buildCompanyModel = () => ({
  create: jest.fn(),
});

const buildUserModel = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
});

describe('CompanyService', () => {
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
