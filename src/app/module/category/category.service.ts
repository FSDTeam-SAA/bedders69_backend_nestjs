import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, supplierId: string) {
    return this.categoryModel.create({
      ...createCategoryDto,
      supplierId,
    });
  }

  async findAll() {
    return this.categoryModel
      .find()
      .sort({ createdAt: -1 })
      .populate('supplierId');
  }

  async findOne(id: string) {
    const result = await this.categoryModel.findById(id).populate('supplierId');

    if (!result) {
      throw new HttpException('Category not found', 404);
    }

    return result;
  }

  async findBySupplierId(supplierId: string) {
    return this.categoryModel
      .find({ supplierId })
      .sort({ createdAt: -1 })
      .populate('supplierId');
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    supplierId: string,
  ) {
    const result = await this.categoryModel.findOneAndUpdate(
      { _id: id, supplierId },
      updateCategoryDto,
      { new: true },
    );

    if (!result) {
      throw new HttpException('Category not found or access denied', 404);
    }

    return result;
  }

  async remove(id: string, supplierId: string) {
    const result = await this.categoryModel.findOneAndDelete({
      _id: id,
      supplierId,
    });

    if (!result) {
      throw new HttpException('Category not found or access denied', 404);
    }

    return result;
  }
}
