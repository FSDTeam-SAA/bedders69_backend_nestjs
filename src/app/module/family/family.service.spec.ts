import { HttpException } from '@nestjs/common';
import { FamilyService } from './family.service';

const buildFamilyModel = () => ({
  create: jest.fn(),
});

const buildUserModel = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
});

describe('FamilyService', () => {
  it('creates a linked family user with basic profile metadata', async () => {
    const familyModel = buildFamilyModel();
    const userModel = buildUserModel();
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({ _id: 'new-user-id' });
    familyModel.create.mockResolvedValue({
      _id: 'family-id',
      userId: 'new-user-id',
      email: 'family@example.com',
    });
    const service = new FamilyService(familyModel as any, userModel as any);

    const result = await service.createFamily({
      firstName: 'Jane',
      lastName: 'Family',
      email: 'family@example.com',
      password: 'secret123',
      phoneNumber: '+447700900123',
      postCode: 'SW1A 1AA',
      city: 'London',
      street: 'Downing Street',
    });

    expect(userModel.create).toHaveBeenCalledWith({
      email: 'family@example.com',
      role: 'family',
      password: 'secret123',
      fullName: 'Jane Family',
      phoneNumber: '+447700900123',
      city: 'London',
      address: 'Downing Street',
    });
    expect(familyModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'new-user-id',
        email: 'family@example.com',
      }),
    );
    expect(result).toMatchObject({
      _id: 'family-id',
      userId: 'new-user-id',
      email: 'family@example.com',
    });
  });

  it('rejects duplicate family emails with a bad request exception', async () => {
    const familyModel = buildFamilyModel();
    const userModel = buildUserModel();
    userModel.findOne.mockResolvedValue({ _id: 'existing-user-id' });
    const service = new FamilyService(familyModel as any, userModel as any);

    const createPromise = service.createFamily({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'family@example.com',
      password: 'secret123',
      phoneNumber: '+447700900123',
      postCode: 'SW1A 1AA',
      city: 'London',
      street: 'Downing Street',
    });

    await expect(createPromise).rejects.toMatchObject<HttpException>({
      message: 'User already exists',
      status: 400,
    });
    expect(familyModel.create).not.toHaveBeenCalled();
  });
});
