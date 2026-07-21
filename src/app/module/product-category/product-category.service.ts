import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import {
  ProductCategory,
  ProductCategoryDocument,
} from './entities/product-category.entity';

@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectModel(ProductCategory.name)
    private readonly productCategoryModel: Model<ProductCategoryDocument>,
  ) {}

  async create(
    createProductCategoryDto: CreateProductCategoryDto,
    supplierId: string,
  ) {
    return this.productCategoryModel.create({
      ...createProductCategoryDto,
      supplierId,
    });
  }

  async findAll() {
    return this.productCategoryModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const result = await this.productCategoryModel.findById(id);

    if (!result) {
      throw new HttpException('Product category not found', 404);
    }

    return result;
  }

  async findBySupplierId(supplierId: string) {
    return this.productCategoryModel
      .find({ supplierId })
      .sort({ createdAt: -1 });
  }

  async update(
    id: string,
    updateProductCategoryDto: UpdateProductCategoryDto,
    supplierId: string,
  ) {
    const result = await this.productCategoryModel.findOneAndUpdate(
      { _id: id, supplierId },
      updateProductCategoryDto,
      { new: true },
    );

    if (!result) {
      throw new HttpException(
        'Product category not found or access denied',
        404,
      );
    }

    return result;
  }

  async remove(id: string, supplierId: string) {
    const result = await this.productCategoryModel.findOneAndDelete({
      _id: id,
      supplierId,
    });

    if (!result) {
      throw new HttpException(
        'Product category not found or access denied',
        404,
      );
    }

    return result;
  }
}
