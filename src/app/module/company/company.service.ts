import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company, CompanyDocument } from './entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
  ) {}

  private getCompletion(values: Record<string, unknown>) {
    const requiredFields = [
      'companyName',
      'email',
      'phoneNumber',
      'address',
      'postCode',
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

  async createCompany(
    createCompanyDto: CreateCompanyDto,
    files?: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      cvResume?: Express.Multer.File[];
      supportingDocuments?: Express.Multer.File[];
    },
  ) {
    const user = await this.userModel.findOne({
      email: createCompanyDto.email,
    });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.userModel.create({
      email: createCompanyDto.email,
      role: 'care_company',
      password: createCompanyDto.password,
      fullName: createCompanyDto.companyName,
      phoneNumber: createCompanyDto.phoneNumber,
      address: createCompanyDto.address,
    });

    const logo = files?.logo?.[0];
    if (logo) {
      const { url } = await fileUpload.uploadToCloudinary(logo);
      createCompanyDto.logo = url;
    }

    const coverPhoto = files?.coverPhoto?.[0];
    if (coverPhoto) {
      const { url } = await fileUpload.uploadToCloudinary(coverPhoto);
      createCompanyDto.coverPhoto = url;
    }

    const cvResume = files?.cvResume?.[0];
    if (cvResume) {
      const { url } = await fileUpload.uploadToCloudinary(cvResume);
      createCompanyDto.cvResume = url;
    }

    if (files?.supportingDocuments?.length) {
      const uploadedDocuments = await Promise.all(
        files.supportingDocuments.map((file) =>
          fileUpload.uploadToCloudinary(file),
        ),
      );
      createCompanyDto.supportingDocuments = uploadedDocuments.map(
        (file) => file.url,
      );
    }

    const result = await this.companyModel.create({
      ...createCompanyDto,
      userId: newUser._id,
      ...this.getCompletion({ ...createCompanyDto }),
    });

    return result;
  }

  async getMyProfile(userId: string) {
    const company = await this.companyModel.findOne({ userId });
    if (!company) {
      throw new HttpException(
        'Care company profile not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return company;
  }

  async updateMyProfile(
    userId: string,
    updateCompanyDto: UpdateCompanyDto,
    files?: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      cvResume?: Express.Multer.File[];
      supportingDocuments?: Express.Multer.File[];
    },
  ) {
    const currentCompany = await this.getMyProfile(userId);

    const logo = files?.logo?.[0];
    if (logo) {
      const { url } = await fileUpload.uploadToCloudinary(logo);
      updateCompanyDto.logo = url;
    }

    const coverPhoto = files?.coverPhoto?.[0];
    if (coverPhoto) {
      const { url } = await fileUpload.uploadToCloudinary(coverPhoto);
      updateCompanyDto.coverPhoto = url;
    }

    const cvResume = files?.cvResume?.[0];
    if (cvResume) {
      const { url } = await fileUpload.uploadToCloudinary(cvResume);
      updateCompanyDto.cvResume = url;
    }

    if (files?.supportingDocuments?.length) {
      const uploadedDocuments = await Promise.all(
        files.supportingDocuments.map((file) =>
          fileUpload.uploadToCloudinary(file),
        ),
      );
      updateCompanyDto.supportingDocuments = uploadedDocuments.map(
        (file) => file.url,
      );
    }

    const updatedCompany = await this.companyModel.findOneAndUpdate(
      { userId },
      {
        ...updateCompanyDto,
        ...this.getCompletion({
          ...currentCompany.toObject?.(),
          ...updateCompanyDto,
        }),
      },
      { new: true },
    );

    const linkedUserUpdate: Record<string, unknown> = {};
    if (updateCompanyDto.companyName) {
      linkedUserUpdate.fullName = updateCompanyDto.companyName;
    }
    if (updateCompanyDto.phoneNumber) {
      linkedUserUpdate.phoneNumber = updateCompanyDto.phoneNumber;
    }
    if (updateCompanyDto.address) {
      linkedUserUpdate.address = updateCompanyDto.address;
    }

    if (Object.keys(linkedUserUpdate).length) {
      await this.userModel.findByIdAndUpdate(userId, linkedUserUpdate);
    }

    return updatedCompany;
  }
}
