import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateProductSupplierDto } from './dto/create-product-supplier.dto';
import { UpdateProductSupplierDto } from './dto/update-product-supplier.dto';
import {
  ProductSupplier,
  ProductSupplierDocument,
} from './entities/product-supplier.entity';

type ProductSupplierUploadFiles = {
  logo?: Express.Multer.File[];
  coverPhoto?: Express.Multer.File[];
};

@Injectable()
export class ProductSupplierService {
  constructor(
    @InjectModel(ProductSupplier.name)
    private readonly productSupplierModel: Model<ProductSupplierDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private getCompletion(values: Record<string, unknown>) {
    const requiredFields = [
      'name',
      'email',
      'phoneNumber',
      'storeName',
      'description',
      'websiteLink',
      'state',
      'country',
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

  private async uploadSingleFile(file?: Express.Multer.File) {
    if (!file) {
      return undefined;
    }

    const { url } = await fileUpload.uploadToCloudinary(file);
    return url;
  }

  async createProductSupplier(
    createProductSupplierDto: CreateProductSupplierDto,
    files?: ProductSupplierUploadFiles,
  ) {
    const user = await this.userModel.findOne({
      email: createProductSupplierDto.email,
    });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.userModel.create({
      email: createProductSupplierDto.email,
      role: 'supplier',
      password: createProductSupplierDto.password,
      fullName: createProductSupplierDto.name,
      phoneNumber: createProductSupplierDto.phoneNumber,
      country: createProductSupplierDto.country,
      address: createProductSupplierDto.address,
    });

    const logo = await this.uploadSingleFile(files?.logo?.[0]);
    if (logo) {
      createProductSupplierDto.logo = logo;
    }

    const coverPhoto = await this.uploadSingleFile(files?.coverPhoto?.[0]);
    if (coverPhoto) {
      createProductSupplierDto.coverPhoto = coverPhoto;
    }

    const productSupplierPayload: Partial<CreateProductSupplierDto> = {
      ...createProductSupplierDto,
    };
    delete productSupplierPayload.password;

    const result = await this.productSupplierModel.create({
      ...productSupplierPayload,
      userId: newUser._id,
      ...this.getCompletion({ ...productSupplierPayload }),
    });

    return result;
  }

  async getMyProfile(userId: string) {
    const productSupplier = await this.productSupplierModel.findOne({
      userId,
    });
    if (!productSupplier) {
      throw new HttpException(
        'Product supplier profile not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return productSupplier;
  }

  async updateMyProfile(
    userId: string,
    updateProductSupplierDto: UpdateProductSupplierDto,
    files?: ProductSupplierUploadFiles,
  ) {
    const currentProductSupplier = await this.getMyProfile(userId);

    const logo = await this.uploadSingleFile(files?.logo?.[0]);
    if (logo) {
      updateProductSupplierDto.logo = logo;
    }

    const coverPhoto = await this.uploadSingleFile(files?.coverPhoto?.[0]);
    if (coverPhoto) {
      updateProductSupplierDto.coverPhoto = coverPhoto;
    }

    const productSupplierPayload: UpdateProductSupplierDto = {
      ...updateProductSupplierDto,
    };
    delete productSupplierPayload.password;

    const updatedProductSupplier =
      await this.productSupplierModel.findOneAndUpdate(
        { userId },
        {
          ...productSupplierPayload,
          ...this.getCompletion({
            ...currentProductSupplier.toObject?.(),
            ...productSupplierPayload,
          }),
        },
        { new: true },
      );

    const linkedUserUpdate: Record<string, unknown> = {};
    if (productSupplierPayload.name) {
      linkedUserUpdate.fullName = productSupplierPayload.name;
    }
    if (productSupplierPayload.phoneNumber) {
      linkedUserUpdate.phoneNumber = productSupplierPayload.phoneNumber;
    }
    if (productSupplierPayload.country) {
      linkedUserUpdate.country = productSupplierPayload.country;
    }
    if (productSupplierPayload.address) {
      linkedUserUpdate.address = productSupplierPayload.address;
    }

    if (Object.keys(linkedUserUpdate).length) {
      await this.userModel.findByIdAndUpdate(userId, linkedUserUpdate);
    }

    return updatedProductSupplier;
  }
}
