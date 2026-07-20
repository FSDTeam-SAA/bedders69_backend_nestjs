import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateCareDto } from './dto/create-care.dto';
import { UpdateCareDto } from './dto/update-care.dto';
import { Care, CareDocument } from './entities/care.entity';

@Injectable()
export class CareService {
  constructor(
    @InjectModel(Care.name) private careModel: Model<CareDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private getCompletion(values: Record<string, unknown>) {
    const requiredFields = [
      'careName',
      'email',
      'phoneNumber',
      'address',
      'postCode',
      'shifts',
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

  async createCare(
    createCareDto: CreateCareDto,
    files?: Express.Multer.File[],
  ) {
    const user = await this.userModel.findOne({
      email: createCareDto.email,
    });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.userModel.create({
      email: createCareDto.email,
      role: 'carer',
      password: createCareDto.password,
      fullName: createCareDto.careName,
      phoneNumber: createCareDto.phoneNumber,
      address: createCareDto.address,
      dateOfBirth: createCareDto.dateOfBirth,
      gender: createCareDto.gender,
    });

    if (files && files.length > 0) {
      const profilePicture = files.find(
        (file) => file.fieldname === 'profilePicture',
      );
      if (profilePicture) {
        const { url } = await fileUpload.uploadToCloudinary(profilePicture);
        createCareDto.profilePicture = url;
      }

      const documents = files.filter((file) => file.fieldname === 'documents');
      if (documents && documents.length > 0) {
        const urls = await Promise.all(
          documents.map(async (document) => {
            const { url } = await fileUpload.uploadToCloudinary(document);
            return url;
          }),
        );
        createCareDto.documents = urls;
      }
    }

    const care = await this.careModel.create({
      ...createCareDto,
      userId: newUser._id,
      ...this.getCompletion({ ...createCareDto }),
    });

    return care;
  }

  async getMyProfile(userId: string) {
    const care = await this.careModel.findOne({ userId });
    if (!care) {
      throw new HttpException('Carer profile not found', HttpStatus.NOT_FOUND);
    }

    return care;
  }

  async updateMyProfile(
    userId: string,
    updateCareDto: UpdateCareDto,
    files?: Express.Multer.File[],
  ) {
    const currentCare = await this.getMyProfile(userId);

    if (files && files.length > 0) {
      const profilePicture = files.find(
        (file) => file.fieldname === 'profilePicture',
      );
      if (profilePicture) {
        const { url } = await fileUpload.uploadToCloudinary(profilePicture);
        updateCareDto.profilePicture = url;
      }

      const documents = files.filter((file) => file.fieldname === 'documents');
      if (documents.length > 0) {
        const urls = await Promise.all(
          documents.map(async (document) => {
            const { url } = await fileUpload.uploadToCloudinary(document);
            return url;
          }),
        );
        updateCareDto.documents = urls;
      }
    }

    const updatedCare = await this.careModel.findOneAndUpdate(
      { userId },
      {
        ...updateCareDto,
        ...this.getCompletion({
          ...currentCare.toObject?.(),
          ...updateCareDto,
        }),
      },
      { new: true },
    );

    const linkedUserUpdate: Record<string, unknown> = {};
    if (updateCareDto.careName) {
      linkedUserUpdate.fullName = updateCareDto.careName;
    }
    if (updateCareDto.phoneNumber) {
      linkedUserUpdate.phoneNumber = updateCareDto.phoneNumber;
    }
    if (updateCareDto.address) {
      linkedUserUpdate.address = updateCareDto.address;
    }
    if (updateCareDto.dateOfBirth) {
      linkedUserUpdate.dateOfBirth = updateCareDto.dateOfBirth;
    }
    if (updateCareDto.gender) {
      linkedUserUpdate.gender = updateCareDto.gender;
    }

    if (Object.keys(linkedUserUpdate).length) {
      await this.userModel.findByIdAndUpdate(userId, linkedUserUpdate);
    }

    return updatedCare;
  }
}
