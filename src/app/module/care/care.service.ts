import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
      status: 'pending',
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
      isActive: false,
      ...this.getCompletion({ ...carePayload }),
    });

    return care;
  }

  async getMyProfile(userId: string) {
    const userObjId = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : null;

    const user = await this.userModel.findOne({
      $or: [{ _id: userId }, ...(userObjId ? [{ _id: userObjId }] : [])],
    });

    if (!user) {
      throw new HttpException('Carer user not found', HttpStatus.NOT_FOUND);
    }

    let care = await this.careModel.findOne({
      $or: [
        { userId: user._id },
        { userId: String(user._id) },
        ...(userObjId ? [{ userId: userObjId }] : []),
        ...(user.email ? [{ email: user.email }] : []),
      ],
    });

    const nameParts = (user.fullName || '').trim().split(/\s+/);
    const defaultFirstName = (user as any).firstName || nameParts[0] || '';
    const defaultLastName =
      (user as any).lastName || nameParts.slice(1).join(' ');

    if (!care) {
      care = await this.careModel.create({
        userId: user._id,
        careName: user.fullName || 'Carer Name',
        firstName: defaultFirstName,
        lastName: defaultLastName,
        fullName: user.fullName || 'Carer Name',
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        postCode: (user as any).postCode || '',
        country: user.country || 'United Kingdom',
        region: user.city || '',
        gender: user.gender || undefined,
        dateOfBirth: user.dateOfBirth || undefined,
        profileCompletionPercentage: 0,
        profileCompletionStatus: 'incomplete',
      });
    } else {
      let needsCareUpdate = false;
      const careUpdates: Record<string, any> = {};

      if ((!care.careName || care.careName === 'Carer Name') && user.fullName) {
        careUpdates.careName = user.fullName;
        care.careName = user.fullName;
        needsCareUpdate = true;
      }
      if (!care.phoneNumber && user.phoneNumber) {
        careUpdates.phoneNumber = user.phoneNumber;
        care.phoneNumber = user.phoneNumber;
        needsCareUpdate = true;
      }
      if (!care.postCode && (user as any).postCode) {
        careUpdates.postCode = (user as any).postCode;
        care.postCode = (user as any).postCode;
        needsCareUpdate = true;
      }
      if (!care.email && user.email) {
        careUpdates.email = user.email;
        care.email = user.email;
        needsCareUpdate = true;
      }
      if (!care.address && user.address) {
        careUpdates.address = user.address;
        care.address = user.address;
        needsCareUpdate = true;
      }
      if (!care.country && user.country) {
        careUpdates.country = user.country;
        care.country = user.country;
        needsCareUpdate = true;
      }
      if (!care.region && user.city) {
        careUpdates.region = user.city;
        care.region = user.city;
        needsCareUpdate = true;
      }
      if (!care.gender && user.gender) {
        careUpdates.gender = user.gender;
        care.gender = user.gender;
        needsCareUpdate = true;
      }
      if (!care.dateOfBirth && user.dateOfBirth) {
        careUpdates.dateOfBirth = user.dateOfBirth;
        care.dateOfBirth = user.dateOfBirth;
        needsCareUpdate = true;
      }

      const activeName = (care.careName || user.fullName || '').trim();
      const currentParts = activeName.split(/\s+/);
      const activeFirst = (user as any).firstName || currentParts[0] || '';
      const activeLast = (user as any).lastName || currentParts.slice(1).join(' ');

      if (!(care as any).firstName && activeFirst) {
        careUpdates.firstName = activeFirst;
        (care as any).firstName = activeFirst;
        needsCareUpdate = true;
      }
      if (!(care as any).lastName && activeLast) {
        careUpdates.lastName = activeLast;
        (care as any).lastName = activeLast;
        needsCareUpdate = true;
      }
      if (!(care as any).fullName && activeName) {
        careUpdates.fullName = activeName;
        (care as any).fullName = activeName;
        needsCareUpdate = true;
      }

      if (!care.userId || String(care.userId) !== String(user._id)) {
        careUpdates.userId = user._id;
        care.userId = user._id;
        needsCareUpdate = true;
      }

      if (needsCareUpdate) {
        await this.careModel.findByIdAndUpdate(care._id, careUpdates);
      }

      // Sync reverse to user if care has data that user lacks
      let needsUserUpdate = false;
      const userUpdates: Record<string, any> = {};
      if (!user.phoneNumber && care.phoneNumber) {
        userUpdates.phoneNumber = care.phoneNumber;
        needsUserUpdate = true;
      }
      if (!(user as any).postCode && care.postCode) {
        userUpdates.postCode = care.postCode;
        needsUserUpdate = true;
      }
      if (!user.address && care.address) {
        userUpdates.address = care.address;
        needsUserUpdate = true;
      }
      if (!user.country && care.country) {
        userUpdates.country = care.country;
        needsUserUpdate = true;
      }
      if (!user.gender && care.gender) {
        userUpdates.gender = care.gender;
        needsUserUpdate = true;
      }
      if (!user.dateOfBirth && care.dateOfBirth) {
        userUpdates.dateOfBirth = care.dateOfBirth;
        needsUserUpdate = true;
      }
      if (needsUserUpdate) {
        await this.userModel.findByIdAndUpdate(user._id, userUpdates);
      }
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

    // Derive names if careName or firstName/lastName are updated
    if (carePayload.careName) {
      const parts = carePayload.careName.trim().split(/\s+/);
      (carePayload as any).firstName = (carePayload as any).firstName || parts[0] || '';
      (carePayload as any).lastName = (carePayload as any).lastName || parts.slice(1).join(' ');
      (carePayload as any).fullName = carePayload.careName;
    } else if ((carePayload as any).firstName || (carePayload as any).lastName) {
      const f = (carePayload as any).firstName || '';
      const l = (carePayload as any).lastName || '';
      carePayload.careName = `${f} ${l}`.trim();
      (carePayload as any).fullName = carePayload.careName;
    }

    const updatedCare = await this.careModel.findOneAndUpdate(
      { _id: currentCare._id },
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
      linkedUserUpdate.firstName = (carePayload as any).firstName;
      linkedUserUpdate.lastName = (carePayload as any).lastName;
    }
    if (carePayload.phoneNumber) {
      linkedUserUpdate.phoneNumber = carePayload.phoneNumber;
    }
    if (carePayload.postCode) {
      linkedUserUpdate.postCode = carePayload.postCode;
    }
    if (carePayload.address) {
      linkedUserUpdate.address = carePayload.address;
    }
    if (carePayload.region) {
      linkedUserUpdate.city = carePayload.region;
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
      await this.userModel.findByIdAndUpdate(currentCare.userId, linkedUserUpdate);
    }

    return updatedCare;
  }
}
