import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import { fileUpload } from 'src/app/helpers/fileUploder';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import { Agency, AgencyDocument } from '../agency/entities/agency.entity';
import { Care, CareDocument } from '../care/entities/care.entity';
import { Company, CompanyDocument } from '../company/entities/company.entity';
import { Family, FamilyDocument } from '../family/entities/family.entity';
import {
  ProductSupplier,
  ProductSupplierDocument,
} from '../product-supplier/entities/product-supplier.entity';
import {
  ServiceProvider,
  ServiceProviderDocument,
} from '../service-provider/entities/service-provider.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';

const userSearchAbleFields = [
  'fullName',
  'email',
  'role',
  'gender',
  'phoneNumber',
  'country',
  'city',
  'address',
  'status',
];

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Family.name) private familyModel: Model<FamilyDocument>,
    @InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>,
    @InjectModel(Care.name) private careModel: Model<CareDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(ProductSupplier.name)
    private productSupplierModel: Model<ProductSupplierDocument>,
    @InjectModel(ServiceProvider.name)
    private serviceProviderModel: Model<ServiceProviderDocument>,
  ) {}

  async createFamily(createUserDto: CreateUserDto, file?: Express.Multer.File) {
    const user = await this.userModel.findOne({ email: createUserDto.email });
    if (user) {
      throw new HttpException('User already exists', 400);
    }
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      createUserDto.profilePicture = uploadedFile.url;
    }
    const createdUser = await this.userModel.create(createUserDto);
    return createdUser;
  }

  async getAllUser(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = buildWhereConditions(params, userSearchAbleFields);

    const total = await this.userModel.countDocuments(whereConditions);

    // 1. Fetch paginated users
    const users = await this.userModel
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .lean();

    if (users.length === 0) {
      return {
        meta: { page, limit, total },
        data: users,
      };
    }

    // 2. Group user IDs by role for efficient batch queries
    const userIdsByRole: Record<string, Types.ObjectId[]> = {};
    users.forEach((user) => {
      if (!userIdsByRole[user.role]) {
        userIdsByRole[user.role] = [];
      }
      userIdsByRole[user.role].push(user._id);
    });

    // 3. Fetch role-specific details in parallel (max 6 queries, batched by role)
    const detailsResults = await Promise.all(
      Object.entries(userIdsByRole).map(async ([role, userIds]) => {
        let model: Model<any>;

        switch (role) {
          case 'family':
            model = this.familyModel;
            break;
          case 'agency':
            model = this.agencyModel;
            break;
          case 'carer':
            model = this.careModel;
            break;
          case 'care_company':
            model = this.companyModel;
            break;
          case 'supplier':
            model = this.productSupplierModel;
            break;
          case 'service_provider':
            model = this.serviceProviderModel;
            break;
          default:
            return [];
        }

        return model.find({ userId: { $in: userIds } }).lean();
      }),
    );

    // 4. Build a map: userId (string) -> details object
    const detailsMap = new Map<string, any>();
    detailsResults.flat().forEach((detail) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      detailsMap.set(detail.userId.toString(), detail);
    });

    // 5. Merge details into each user
    const data = users.map((user) => ({
      ...user,
      details: detailsMap.get(user._id.toString()) || null,
    }));

    return {
      meta: {
        page,
        limit,
        total,
      },
      data,
    };
  }

  async getSingleUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    return user;
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      updateUserDto.profilePicture = uploadedFile.url;
    }
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true },
    );
    return updatedUser;
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    const result = await this.userModel.findByIdAndDelete(id);
    return result;
  }

  async getProfile(id: string) {
    const result = await this.userModel.findById(id);
    if (!result) {
      throw new HttpException('User not found', 404);
    }
    return result;
  }

  async updateMyProfile(
    id: string,
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      updateUserDto.profilePicture = uploadedFile.url;
    }
    const result = await this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
    });
    return result;
  }
}
