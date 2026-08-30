import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from 'src/app/helpers/fileUploder';
import {
  ProductCategory,
  ProductCategoryDocument,
} from '../product-category/entities/product-category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductCategory.name)
    private readonly productCategoryModel: Model<ProductCategoryDocument>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    supplierId: string,
    files?: Express.Multer.File[],
  ) {
    const category = await this.productCategoryModel.findOne({
      _id: createProductDto.categoryId,
      supplierId,
    });

    if (!category) {
      throw new HttpException('Category not found or access denied', 404);
    }

    const photo = files?.length
      ? await Promise.all(
          files.map((file) =>
            fileUpload.uploadToCloudinary(file).then(({ url }) => url),
          ),
        )
      : createProductDto.photo;

    return this.productModel.create({
      ...createProductDto,
      supplierId,
      ...(photo ? { photo } : {}),
    });
  }

  async findAll() {
    return this.productModel
      .find()
      .sort({ createdAt: -1 })
      .populate('categoryId')
      .populate('supplierId');
  }

  async findOne(id: string) {
    const result = await this.productModel
      .findById(id)
      .populate('categoryId')
      .populate('supplierId');

    if (!result) {
      throw new HttpException('Product not found', 404);
    }

    return result;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    supplierId: string,
    files?: Express.Multer.File[],
  ) {
    if (updateProductDto.categoryId) {
      const category = await this.productCategoryModel.findOne({
        _id: updateProductDto.categoryId,
        supplierId,
      });

      if (!category) {
        throw new HttpException('Category not found or access denied', 404);
      }
    }

    const photo = files?.length
      ? await Promise.all(
          files.map((file) =>
            fileUpload.uploadToCloudinary(file).then(({ url }) => url),
          ),
        )
      : updateProductDto.photo;

    const result = await this.productModel.findOneAndUpdate(
      { _id: id, supplierId },
      { ...updateProductDto, ...(photo ? { photo } : {}) },
      { new: true },
    );

    if (!result) {
      throw new HttpException('Product not found or access denied', 404);
    }

    return result;
  }

  async remove(id: string, supplierId: string) {
    const result = await this.productModel.findOneAndDelete({
      _id: id,
      supplierId,
    });

    if (!result) {
      throw new HttpException('Product not found or access denied', 404);
    }

    return result;
  }

  async findByCategory(categoryId: string) {
    return this.productModel
      .find({ categoryId })
      .sort({ createdAt: -1 })
      .populate('categoryId')
      .populate('supplierId');
  }

  async findBySupplierId(supplierId: string) {
    return this.productModel
      .find({ supplierId })
      .sort({ createdAt: -1 })
      .populate('categoryId')
      .populate('supplierId');
  }
}
