import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import {
  ServiceProvider,
  ServiceProviderDocument,
} from './entities/service-provider.entity';

type ServiceProviderUploadFiles = {
  logo?: Express.Multer.File[];
  coverPhoto?: Express.Multer.File[];
};

@Injectable()
export class ServiceProviderService {
  constructor(
    @InjectModel(ServiceProvider.name)
    private readonly serviceProviderModel: Model<ServiceProviderDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private getCompletion(values: Record<string, unknown>) {
    const requiredFields = [
      'name',
      'email',
      'phoneNumber',
      'companyName',
      'bussinessDescription',
      'websiteLink',
      'serviceCoverArea',
      'bussinessResgistrationNumber',
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

  private async uploadSingleFile(file?: Express.Multer.File) {
    if (!file) {
      return undefined;
    }

    const { url } = await fileUpload.uploadToCloudinary(file);
    return url;
  }

  async createServiceProvider(
    createServiceProviderDto: CreateServiceProviderDto,
    files?: ServiceProviderUploadFiles,
  ) {
    const user = await this.userModel.findOne({
      email: createServiceProviderDto.email,
    });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.userModel.create({
      email: createServiceProviderDto.email,
      role: 'service_provider',
      password: createServiceProviderDto.password,
      fullName: createServiceProviderDto.name,
      phoneNumber: createServiceProviderDto.phoneNumber,
    });

    const logo = await this.uploadSingleFile(files?.logo?.[0]);
    if (logo) {
      createServiceProviderDto.logo = logo;
    }

    const coverPhoto = await this.uploadSingleFile(files?.coverPhoto?.[0]);
    if (coverPhoto) {
      createServiceProviderDto.coverPhoto = coverPhoto;
    }

    const serviceProviderPayload: Partial<CreateServiceProviderDto> = {
      ...createServiceProviderDto,
    };
    delete serviceProviderPayload.password;

    const result = await this.serviceProviderModel.create({
      ...serviceProviderPayload,
      userId: newUser._id,
      ...this.getCompletion({ ...serviceProviderPayload }),
    });

    return result;
  }

  async getMyProfile(userId: string) {
    const serviceProvider = await this.serviceProviderModel.findOne({
      userId,
    });
    if (!serviceProvider) {
      throw new HttpException(
        'Service provider profile not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return serviceProvider;
  }

  async updateMyProfile(
    userId: string,
    updateServiceProviderDto: UpdateServiceProviderDto,
    files?: ServiceProviderUploadFiles,
  ) {
    const currentServiceProvider = await this.getMyProfile(userId);

    const logo = await this.uploadSingleFile(files?.logo?.[0]);
    if (logo) {
      updateServiceProviderDto.logo = logo;
    }

    const coverPhoto = await this.uploadSingleFile(files?.coverPhoto?.[0]);
    if (coverPhoto) {
      updateServiceProviderDto.coverPhoto = coverPhoto;
    }

    const serviceProviderPayload: UpdateServiceProviderDto = {
      ...updateServiceProviderDto,
    };
    delete serviceProviderPayload.password;

    const updatedServiceProvider =
      await this.serviceProviderModel.findOneAndUpdate(
        { userId },
        {
          ...serviceProviderPayload,
          ...this.getCompletion({
            ...currentServiceProvider.toObject?.(),
            ...serviceProviderPayload,
          }),
        },
        { new: true },
      );

    const linkedUserUpdate: Record<string, unknown> = {};
    if (serviceProviderPayload.name) {
      linkedUserUpdate.fullName = serviceProviderPayload.name;
    }
    if (serviceProviderPayload.phoneNumber) {
      linkedUserUpdate.phoneNumber = serviceProviderPayload.phoneNumber;
    }

    if (Object.keys(linkedUserUpdate).length) {
      await this.userModel.findByIdAndUpdate(userId, linkedUserUpdate);
    }

    return updatedServiceProvider;
  }
}
