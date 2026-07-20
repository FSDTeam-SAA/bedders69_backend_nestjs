import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateCareDto } from './dto/create-care.dto';
import { Care, CareDocument } from './entities/care.entity';

@Injectable()
export class CareService {
  constructor(
    @InjectModel(Care.name) private careModel: Model<CareDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}
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
    });

    return care;
  }
}
