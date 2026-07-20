import { HttpException } from '@nestjs/common';
import { CareService } from './care.service';

const buildCareModel = () => ({
  create: jest.fn(),
});

const buildUserModel = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
});

describe('CareService', () => {
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
