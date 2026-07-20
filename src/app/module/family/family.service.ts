import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { Family, FamilyDocument } from './entities/family.entity';

@Injectable()
export class FamilyService {
  constructor(
    @InjectModel(Family.name)
    private readonly familyModel: Model<FamilyDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private getCompletion(values: Record<string, unknown>) {
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'city',
      'street',
    ];
    const completedFields = requiredFields.filter((field) => {
      const value = values[field];
      return typeof value === 'string' ? value.trim() !== '' : Boolean(value);
    }).length;
    const profileCompletionPercentage = Math.round(
      (completedFields / requiredFields.length) * 100,
    );

    return {
      profileCompletionPercentage,
      profileCompletionStatus:
        profileCompletionPercentage === 100 ? 'complete' : 'incomplete',
    };
  }

  async createFamily(
    createFamilyDto: CreateFamilyDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.userModel.findOne({ email: createFamilyDto.email });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.userModel.create({
      email: createFamilyDto.email,
      role: 'family',
      password: createFamilyDto.password,
      fullName: [createFamilyDto.firstName, createFamilyDto.lastName]
        .filter(Boolean)
        .join(' '),
      phoneNumber: createFamilyDto.phoneNumber,
      city: createFamilyDto.city,
      address: createFamilyDto.street,
    });

    if (file) {
      const { url } = await fileUpload.uploadToCloudinary(file);
      createFamilyDto.profilePicture = url;
    }

    const result = await this.familyModel.create({
      ...createFamilyDto,
      userId: newUser._id,
      ...this.getCompletion({ ...createFamilyDto }),
    });
    return result;
  }

  async getMyProfile(userId: string) {
    const family = await this.familyModel.findOne({ userId });
    if (!family) {
      throw new HttpException('Family profile not found', HttpStatus.NOT_FOUND);
    }

    return family;
  }

  async updateMyProfile(
    userId: string,
    updateFamilyDto: UpdateFamilyDto,
    file?: Express.Multer.File,
  ) {
    const currentFamily = await this.getMyProfile(userId);

    if (file) {
      const { url } = await fileUpload.uploadToCloudinary(file);
      updateFamilyDto.profilePicture = url;
    }

    const updatedFamily = await this.familyModel.findOneAndUpdate(
      { userId },
      {
        ...updateFamilyDto,
        ...this.getCompletion({
          ...currentFamily.toObject?.(),
          ...updateFamilyDto,
        }),
      },
      { new: true },
    );

    const linkedUserUpdate: Record<string, unknown> = {};
    if (updateFamilyDto.firstName || updateFamilyDto.lastName) {
      linkedUserUpdate.fullName = [
        updateFamilyDto.firstName ?? currentFamily.firstName,
        updateFamilyDto.lastName ?? currentFamily.lastName,
      ]
        .filter(Boolean)
        .join(' ');
    }
    if (updateFamilyDto.phoneNumber) {
      linkedUserUpdate.phoneNumber = updateFamilyDto.phoneNumber;
    }
    if (updateFamilyDto.city) {
      linkedUserUpdate.city = updateFamilyDto.city;
    }
    if (updateFamilyDto.street) {
      linkedUserUpdate.address = updateFamilyDto.street;
    }

    if (Object.keys(linkedUserUpdate).length) {
      await this.userModel.findByIdAndUpdate(userId, linkedUserUpdate);
    }

    return updatedFamily;
  }
}
