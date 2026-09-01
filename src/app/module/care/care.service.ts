import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateCareDto } from './dto/create-care.dto';
import { UpdateCareDto } from './dto/update-care.dto';
import { Care, CareDocument } from './entities/care.entity';

type CareUploadFiles = {
  profilePicture?: Express.Multer.File[];
  cv?: Express.Multer.File[];
  documents?: Express.Multer.File[];
  dbsCertificate?: Express.Multer.File[];
  careCertificate?: Express.Multer.File[];
  trainingCertificates?: Express.Multer.File[];
  firstAidCertificate?: Express.Multer.File[];
  qualificationCertificates?: Express.Multer.File[];
};

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
      'location',
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

  private async uploadMultipleFiles(files?: Express.Multer.File[]) {
    if (!files?.length) {
      return undefined;
    }

    const uploadedFiles = await Promise.all(
      files.map((file) => fileUpload.uploadToCloudinary(file)),
    );
    return uploadedFiles.map((file) => file.url);
  }

  async createCare(createCareDto: CreateCareDto, files?: CareUploadFiles) {
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

    const profilePicture = await this.uploadSingleFile(
      files?.profilePicture?.[0],
    );
    if (profilePicture) {
      createCareDto.profilePicture = profilePicture;
    }

    const cv = await this.uploadSingleFile(files?.cv?.[0]);
    if (cv) {
      createCareDto.cv = cv;
    }

    const dbsCertificate = await this.uploadSingleFile(files?.dbsCertificate?.[0]);
    if (dbsCertificate) {
      createCareDto.dbsCertificate = dbsCertificate;
    }

    const careCertificate = await this.uploadSingleFile(files?.careCertificate?.[0]);
    if (careCertificate) {
      createCareDto.careCertificate = careCertificate;
    }

    const trainingCertificates = await this.uploadMultipleFiles(files?.trainingCertificates);
    if (trainingCertificates) {
      createCareDto.trainingCertificates = trainingCertificates;
    }

    const firstAidCertificate = await this.uploadSingleFile(files?.firstAidCertificate?.[0]);
    if (firstAidCertificate) {
      createCareDto.firstAidCertificate = firstAidCertificate;
    }

    const qualificationCertificates = await this.uploadMultipleFiles(files?.qualificationCertificates);
    if (qualificationCertificates) {
      createCareDto.qualificationCertificates = qualificationCertificates;
    }

    const documents = await this.uploadMultipleFiles(files?.documents);
    if (documents) {
      createCareDto.documents = documents;
    }

    const carePayload: Partial<CreateCareDto> = { ...createCareDto };
    delete carePayload.password;

    const care = await this.careModel.create({
      ...carePayload,
      userId: newUser._id,
      ...this.getCompletion({ ...carePayload }),
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
    files?: CareUploadFiles,
  ) {
    const currentCare = await this.getMyProfile(userId);

    const profilePicture = await this.uploadSingleFile(
      files?.profilePicture?.[0],
    );
    if (profilePicture) {
      updateCareDto.profilePicture = profilePicture;
    }

    const cv = await this.uploadSingleFile(files?.cv?.[0]);
    if (cv) {
      updateCareDto.cv = cv;
    }

    const dbsCertificate = await this.uploadSingleFile(files?.dbsCertificate?.[0]);
    if (dbsCertificate) {
      updateCareDto.dbsCertificate = dbsCertificate;
    }

    const careCertificate = await this.uploadSingleFile(files?.careCertificate?.[0]);
    if (careCertificate) {
      updateCareDto.careCertificate = careCertificate;
    }

    const trainingCertificates = await this.uploadMultipleFiles(files?.trainingCertificates);
    if (trainingCertificates) {
      updateCareDto.trainingCertificates = trainingCertificates;
    }

    const firstAidCertificate = await this.uploadSingleFile(files?.firstAidCertificate?.[0]);
    if (firstAidCertificate) {
      updateCareDto.firstAidCertificate = firstAidCertificate;
    }

    const qualificationCertificates = await this.uploadMultipleFiles(files?.qualificationCertificates);
    if (qualificationCertificates) {
      updateCareDto.qualificationCertificates = qualificationCertificates;
    }

    const documents = await this.uploadMultipleFiles(files?.documents);
    if (documents) {
      updateCareDto.documents = documents;
    }

    const carePayload: UpdateCareDto = { ...updateCareDto };
    delete carePayload.password;

    const updatedCare = await this.careModel.findOneAndUpdate(
      { userId },
      {
        ...carePayload,
        ...this.getCompletion({
          ...currentCare.toObject?.(),
          ...carePayload,
        }),
      },
      { new: true },
    );

    const linkedUserUpdate: Record<string, unknown> = {};
    if (carePayload.careName) {
      linkedUserUpdate.fullName = carePayload.careName;
    }
    if (carePayload.phoneNumber) {
      linkedUserUpdate.phoneNumber = carePayload.phoneNumber;
    }
    if (carePayload.address) {
      linkedUserUpdate.address = carePayload.address;
    }
    if (carePayload.dateOfBirth) {
      linkedUserUpdate.dateOfBirth = carePayload.dateOfBirth;
    }
    if (carePayload.gender) {
      linkedUserUpdate.gender = carePayload.gender;
    }
    if (carePayload.profilePicture) {
      linkedUserUpdate.profilePicture = carePayload.profilePicture;
    }
    if (carePayload.country) {
      linkedUserUpdate.country = carePayload.country;
    }
    if (carePayload.email) {
      linkedUserUpdate.email = carePayload.email;
    }

    if (Object.keys(linkedUserUpdate).length) {
      await this.userModel.findByIdAndUpdate(userId, linkedUserUpdate);
    }

    return updatedCare;
  }
}
