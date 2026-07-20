import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Company, CompanyDocument } from './entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
  ) {}

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
    });

    return result;
  }
}
