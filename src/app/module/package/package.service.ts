import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IFilterParams } from 'src/app/helpers/pick';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Package, PackageDocument } from './entities/package.entity';

@Injectable()
export class PackageService {
  constructor(
    @InjectModel(Package.name)
    private readonly packageModel: Model<PackageDocument>,
  ) {}

  async createPackage(createPackageDto: CreatePackageDto) {
    const existing = await this.packageModel.findOne({
      name: createPackageDto.name,
      type: createPackageDto.type,
    });
    if (existing) {
      throw new HttpException(
        'A package with this name and type already exists',
        400,
      );
    }

    return this.packageModel.create(createPackageDto);
  }

  async getPackages(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const searchableFields = ['name', 'description', 'type'];
    const whereConditions = {
      ...buildWhereConditions(params, searchableFields),
      isActive: true,
    };

    const total = await this.packageModel.countDocuments(whereConditions);
    const packages = await this.packageModel
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .lean();

    return {
      meta: { page, limit, total },
      data: packages,
    };
  }

  async getAllPackages(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const searchableFields = ['name', 'description', 'type'];
    const whereConditions = buildWhereConditions(params, searchableFields);

    const total = await this.packageModel.countDocuments(whereConditions);
    const packages = await this.packageModel
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .lean();

    return {
      meta: { page, limit, total },
      data: packages,
    };
  }

  async getPackage(id: string) {
    const pkg = await this.packageModel.findById(id).lean();
    if (!pkg) {
      throw new HttpException('Package not found', 404);
    }
    return pkg;
  }

  async updatePackage(id: string, updatePackageDto: UpdatePackageDto) {
    const existing = await this.packageModel.findById(id);
    if (!existing) {
      throw new HttpException('Package not found', 404);
    }

    if (updatePackageDto.name || updatePackageDto.type) {
      const duplicate = await this.packageModel.findOne({
        _id: { $ne: id },
        name: updatePackageDto.name || existing.name,
        type: updatePackageDto.type || existing.type,
      });
      if (duplicate) {
        throw new HttpException(
          'A package with this name and type already exists',
          400,
        );
      }
    }

    return this.packageModel.findByIdAndUpdate(id, updatePackageDto, {
      new: true,
    });
  }

  async disablePackage(id: string) {
    const pkg = await this.packageModel.findById(id);
    if (!pkg) {
      throw new HttpException('Package not found', 404);
    }

    pkg.isActive = false;
    await pkg.save();
    return pkg;
  }
}
