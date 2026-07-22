import { HttpException } from '@nestjs/common';
import { FamilyService } from './family.service';

const buildFamilyModel = () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
});

const buildUserModel = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
});

describe('FamilyService', () => {
  it('gets the authenticated family profile by user id', async () => {
    const familyModel = buildFamilyModel();
    const userModel = buildUserModel();
    familyModel.findOne.mockResolvedValue({
      _id: 'family-id',
      userId: 'user-id',
      email: 'family@example.com',
    });
    const service = new FamilyService(familyModel as any, userModel as any);

    const result = await service.getMyProfile('user-id');

    expect(familyModel.findOne).toHaveBeenCalledWith({ userId: 'user-id' });
    expect(result).toMatchObject({
      _id: 'family-id',
      userId: 'user-id',
      email: 'family@example.com',
    });
  });

  it('throws not found when authenticated family profile is missing', async () => {
    const familyModel = buildFamilyModel();
    const userModel = buildUserModel();
    familyModel.findOne.mockResolvedValue(null);
    const service = new FamilyService(familyModel as any, userModel as any);

    await expect(service.getMyProfile('missing-user-id')).rejects.toMatchObject(
      {
        message: 'Family profile not found',
        status: 404,
      },
    );
  });

  it('updates the authenticated family profile and linked user metadata', async () => {
    const familyModel = buildFamilyModel();
    const userModel = buildUserModel();
    familyModel.findOne.mockResolvedValue({
      _id: 'family-id',
      userId: 'user-id',
      email: 'family@example.com',
    });
    familyModel.findOneAndUpdate.mockResolvedValue({
      _id: 'family-id',
      userId: 'user-id',
      firstName: 'Updated',
      lastName: 'Family',
      phoneNumber: '+447700900999',
      city: 'Manchester',
      street: 'New Street',
    });
    const service = new FamilyService(familyModel as any, userModel as any);

    const result = await service.updateMyProfile('user-id', {
      firstName: 'Updated',
      lastName: 'Family',
      phoneNumber: '+447700900999',
      city: 'Manchester',
      street: 'New Street',
    });

    expect(familyModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-id' },
      expect.objectContaining({
        firstName: 'Updated',
        lastName: 'Family',
      }),
      { new: true },
    );
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('user-id', {
      fullName: 'Updated Family',
      phoneNumber: '+447700900999',
      city: 'Manchester',
      address: 'New Street',
    });
    expect(result).toMatchObject({
      _id: 'family-id',
      userId: 'user-id',
      firstName: 'Updated',
    });
  });

  it('preserves existing family name parts when syncing partial name updates', async () => {
    const familyModel = buildFamilyModel();
    const userModel = buildUserModel();
    familyModel.findOne.mockResolvedValue({
      _id: 'family-id',
      userId: 'user-id',
      firstName: 'Jane',
      lastName: 'Family',
      email: 'family@example.com',
    });
    familyModel.findOneAndUpdate.mockResolvedValue({
      _id: 'family-id',
      userId: 'user-id',
      firstName: 'Janet',
      lastName: 'Family',
    });
    const service = new FamilyService(familyModel as any, userModel as any);

    await service.updateMyProfile('user-id', {
      firstName: 'Janet',
    });

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('user-id', {
      fullName: 'Janet Family',
    });
  });

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
