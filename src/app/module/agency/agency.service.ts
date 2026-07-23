import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { Agency, AgencyDocument } from './entities/agency.entity';

type AgencyUploadFiles = {
  documents?: Express.Multer.File[];
};

@Injectable()
export class AgencyService {
  constructor(
    @InjectModel(Agency.name)
    private readonly agencyModel: Model<AgencyDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private getCompletion(values: Record<string, unknown>) {
    const requiredFields = [
      'name',
      'registerNumber',
      'email',
      'phoneNumber',
      'website',
      'discription',
      'address',
      'specialisations',
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

  private async uploadMultipleFiles(files?: Express.Multer.File[]) {
    if (!files?.length) {
      return undefined;
    }

    const uploadedFiles = await Promise.all(
      files.map((file) => fileUpload.uploadToCloudinary(file)),
    );
    return uploadedFiles.map((file) => file.url);
  }

  async createAgency(
    createAgencyDto: CreateAgencyDto,
    files?: AgencyUploadFiles,
  ) {
    const user = await this.userModel.findOne({
      email: createAgencyDto.email,
    });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.userModel.create({
      email: createAgencyDto.email,
      role: 'agency',
      password: createAgencyDto.password,
      fullName: createAgencyDto.name,
      phoneNumber: createAgencyDto.phoneNumber,
      address: createAgencyDto.address,
    });

    const documents = await this.uploadMultipleFiles(files?.documents);
    if (documents) {
      createAgencyDto.documents = documents;
    }

    const agencyPayload: Partial<CreateAgencyDto> = { ...createAgencyDto };
    delete agencyPayload.password;

    const agency = await this.agencyModel.create({
      ...agencyPayload,
      userId: newUser._id,
      ...this.getCompletion({ ...agencyPayload }),
    });

    return agency;
  }

  async getMyProfile(userId: string) {
    const agency = await this.agencyModel.findOne({ userId });
    if (!agency) {
      throw new HttpException('Agency profile not found', HttpStatus.NOT_FOUND);
    }

    return agency;
  }

  async updateMyProfile(
    userId: string,
    updateAgencyDto: UpdateAgencyDto,
    files?: AgencyUploadFiles,
  ) {
    const currentAgency = await this.getMyProfile(userId);

    const documents = await this.uploadMultipleFiles(files?.documents);
    if (documents) {
      updateAgencyDto.documents = documents;
    }

    const agencyPayload: UpdateAgencyDto = { ...updateAgencyDto };
    delete agencyPayload.password;

    const updatedAgency = await this.agencyModel.findOneAndUpdate(
      { userId },
      {
        ...agencyPayload,
        ...this.getCompletion({
          ...currentAgency.toObject?.(),
          ...agencyPayload,
        }),
      },
      { new: true },
    );

    const linkedUserUpdate: Record<string, unknown> = {};
    if (agencyPayload.name) {
      linkedUserUpdate.fullName = agencyPayload.name;
    }
    if (agencyPayload.phoneNumber) {
      linkedUserUpdate.phoneNumber = agencyPayload.phoneNumber;
    }
    if (agencyPayload.address) {
      linkedUserUpdate.address = agencyPayload.address;
    }

    if (Object.keys(linkedUserUpdate).length) {
      await this.userModel.findByIdAndUpdate(userId, linkedUserUpdate);
    }

    return updatedAgency;
  }
}
