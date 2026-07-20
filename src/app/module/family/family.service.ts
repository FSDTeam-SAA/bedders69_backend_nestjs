import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateFamilyDto } from './dto/create-family.dto';
import { Family, FamilyDocument } from './entities/family.entity';

@Injectable()
export class FamilyService {
  constructor(
    @InjectModel(Family.name)
    private readonly familyModel: Model<FamilyDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

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
    });
    return result;
  }
}
