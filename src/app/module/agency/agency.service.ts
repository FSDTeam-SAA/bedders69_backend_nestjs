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
      status: 'pending',
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
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('Agency user not found', HttpStatus.NOT_FOUND);
    }

    let agency = await this.agencyModel.findOne({
      $or: [
        { userId: user._id },
        { userId: String(user._id) },
        ...(user.email ? [{ email: user.email }] : []),
      ],
    });

    if (!agency) {
      agency = await this.agencyModel.create({
        userId: user._id,
        name: user.fullName || 'Agency Name',
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        registerNumber: '',
        website: '',
        discription: '',
        address: user.address || '',
        specialisations: [],
        documents: [],
        profileCompletionPercentage: 0,
        profileCompletionStatus: 'incomplete',
      });
    } else {
      let needsAgencyUpdate = false;
      const agencyUpdates: Record<string, any> = {};

      if ((!agency.name || agency.name === 'Agency Name') && user.fullName) {
        agencyUpdates.name = user.fullName;
        agency.name = user.fullName;
        needsAgencyUpdate = true;
      }
      if (!agency.phoneNumber && user.phoneNumber) {
        agencyUpdates.phoneNumber = user.phoneNumber;
        agency.phoneNumber = user.phoneNumber;
        needsAgencyUpdate = true;
      }
      if (!agency.email && user.email) {
        agencyUpdates.email = user.email;
        agency.email = user.email;
        needsAgencyUpdate = true;
      }
      if (!agency.address && user.address) {
        agencyUpdates.address = user.address;
        agency.address = user.address;
        needsAgencyUpdate = true;
      }
      if (!agency.registerNumber && (user as any).registerNumber) {
        agencyUpdates.registerNumber = (user as any).registerNumber;
        agency.registerNumber = (user as any).registerNumber;
        needsAgencyUpdate = true;
      }
      if (!agency.website && (user as any).website) {
        agencyUpdates.website = (user as any).website;
        agency.website = (user as any).website;
        needsAgencyUpdate = true;
      }
      if (!agency.userId || String(agency.userId) !== String(user._id)) {
        agencyUpdates.userId = user._id;
        agency.userId = user._id;
        needsAgencyUpdate = true;
      }

      if (needsAgencyUpdate) {
        await this.agencyModel.findByIdAndUpdate(agency._id, agencyUpdates);
      }

      let needsUserUpdate = false;
      const userUpdates: Record<string, any> = {};
      if (!user.phoneNumber && agency.phoneNumber) {
        userUpdates.phoneNumber = agency.phoneNumber;
        needsUserUpdate = true;
      }
      if (!user.address && agency.address) {
        userUpdates.address = agency.address;
        needsUserUpdate = true;
      }
      if (!user.fullName && agency.name) {
        userUpdates.fullName = agency.name;
        needsUserUpdate = true;
      }
      if (!(user as any).registerNumber && agency.registerNumber) {
        userUpdates.registerNumber = agency.registerNumber;
        needsUserUpdate = true;
      }
      if (!(user as any).website && agency.website) {
        userUpdates.website = agency.website;
        needsUserUpdate = true;
      }

      if (needsUserUpdate) {
        await this.userModel.findByIdAndUpdate(user._id, userUpdates);
      }
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
    if (agencyPayload.registerNumber) {
      linkedUserUpdate.registerNumber = agencyPayload.registerNumber;
    }
    if (agencyPayload.website) {
      linkedUserUpdate.website = agencyPayload.website;
    }

    if (Object.keys(linkedUserUpdate).length) {
      await this.userModel.findByIdAndUpdate(userId, linkedUserUpdate);
    }

    return updatedAgency;
  }
}
