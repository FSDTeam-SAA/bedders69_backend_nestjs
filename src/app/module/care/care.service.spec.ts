import { HttpException } from '@nestjs/common';
import { CareService } from './care.service';

const buildCareModel = () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
});

const buildUserModel = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
});

describe('CareService', () => {
  it('gets the authenticated carer profile by user id', async () => {
    const careModel = buildCareModel();
    const userModel = buildUserModel();
    careModel.findOne.mockResolvedValue({
      _id: 'care-id',
      userId: 'user-id',
      email: 'carer@example.com',
    });
    const service = new CareService(careModel as any, userModel as any);

    const result = await service.getMyProfile('user-id');

    expect(careModel.findOne).toHaveBeenCalledWith({ userId: 'user-id' });
    expect(result).toMatchObject({
      _id: 'care-id',
      userId: 'user-id',
      email: 'carer@example.com',
    });
  });

  it('throws not found when authenticated carer profile is missing', async () => {
    const careModel = buildCareModel();
    const userModel = buildUserModel();
    careModel.findOne.mockResolvedValue(null);
    const service = new CareService(careModel as any, userModel as any);

    await expect(service.getMyProfile('missing-user-id')).rejects.toMatchObject(
      {
        message: 'Carer profile not found',
        status: 404,
      },
    );
  });

  it('updates the authenticated carer profile and linked user metadata', async () => {
    const careModel = buildCareModel();
    const userModel = buildUserModel();
    careModel.findOne.mockResolvedValue({
      _id: 'care-id',
      userId: 'user-id',
      email: 'carer@example.com',
    });
    careModel.findOneAndUpdate.mockResolvedValue({
      _id: 'care-id',
      userId: 'user-id',
      careName: 'Updated Carer',
      phoneNumber: '+447700900999',
      address: 'New Address',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'female',
    });
    const service = new CareService(careModel as any, userModel as any);

    const result = await service.updateMyProfile('user-id', {
      careName: 'Updated Carer',
      phoneNumber: '+447700900999',
      address: 'New Address',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'female',
    });

    expect(careModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-id' },
      expect.objectContaining({
        careName: 'Updated Carer',
      }),
      { new: true },
    );
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('user-id', {
      fullName: 'Updated Carer',
      phoneNumber: '+447700900999',
      address: 'New Address',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'female',
    });
    expect(result).toMatchObject({
      _id: 'care-id',
      userId: 'user-id',
      careName: 'Updated Carer',
    });
  });

  it('creates a linked carer user with basic profile metadata', async () => {
    const careModel = buildCareModel();
    const userModel = buildUserModel();
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({ _id: 'new-user-id' });
    careModel.create.mockResolvedValue({
      _id: 'care-id',
      userId: 'new-user-id',
      email: 'carer@example.com',
    });
    const service = new CareService(careModel as any, userModel as any);

    const result = await service.createCare({
      careName: 'Jane Carer',
      phoneNumber: '+447700900123',
      email: 'carer@example.com',
      password: 'secret123',
      dateOfBirth: new Date('1995-08-15'),
      gender: 'female',
      address: 'London',
      postCode: 'SW1A 1AA',
      location: {
        type: 'Point',
        coordinates: [-0.1278, 51.5074],
      },
      shifts: 'Day',
    });

    expect(userModel.create).toHaveBeenCalledWith({
      email: 'carer@example.com',
      role: 'carer',
      password: 'secret123',
      fullName: 'Jane Carer',
      phoneNumber: '+447700900123',
      address: 'London',
      dateOfBirth: new Date('1995-08-15'),
      gender: 'female',
    });
    expect(careModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'new-user-id',
        email: 'carer@example.com',
      }),
    );
    expect(result).toMatchObject({
      _id: 'care-id',
      userId: 'new-user-id',
      email: 'carer@example.com',
    });
  });

  it('rejects duplicate carer emails with a bad request exception', async () => {
    const careModel = buildCareModel();
    const userModel = buildUserModel();
    userModel.findOne.mockResolvedValue({ _id: 'existing-user-id' });
    const service = new CareService(careModel as any, userModel as any);

    await expect(
      service.createCare({
        careName: 'Jane Carer',
        phoneNumber: '+447700900123',
        email: 'carer@example.com',
        password: 'secret123',
        dateOfBirth: new Date('1995-08-15'),
        gender: 'female',
        address: 'London',
        postCode: 'SW1A 1AA',
        location: {
          type: 'Point',
          coordinates: [-0.1278, 51.5074],
        },
        shifts: 'Day',
      }),
    ).rejects.toMatchObject<HttpException>({
      message: 'User already exists',
      status: 400,
    });
    expect(careModel.create).not.toHaveBeenCalled();
  });
});
