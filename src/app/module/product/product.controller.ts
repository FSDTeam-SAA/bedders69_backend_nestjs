import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { fileUpload } from 'src/app/helpers/fileUploder';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

const productImageUploadConfig = {
  ...fileUpload.uploadConfig,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => callback(null, file.mimetype.startsWith('image/')),
};

@ApiTags('product')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  async findAll() {
    const result = await this.productService.findAll();

    return {
      message: 'Products retrieved successfully',
      data: result,
    };
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get products by category id' })
  @ApiParam({ name: 'categoryId', type: String, description: 'Category ID' })
  async findByCategory(@Param('categoryId') categoryId: string) {
    const result = await this.productService.findByCategory(categoryId);

    return {
      message: 'Category products retrieved successfully',
      data: result,
    };
  }

  @Get('supplier/:supplierId')
  @ApiOperation({ summary: 'Get products by supplier id' })
  @ApiParam({ name: 'supplierId', type: String, description: 'Supplier ID' })
  async findBySupplierId(@Param('supplierId') supplierId: string) {
    const result = await this.productService.findBySupplierId(supplierId);

    return {
      message: 'Supplier products retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  async findOne(@Param('id') id: string) {
    const result = await this.productService.findOne(id);

    return {
      message: 'Product retrieved successfully',
      data: result,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateProductDto })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard('supplier'))
  @UseInterceptors(FilesInterceptor('photos', 5, productImageUploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProductDto: CreateProductDto,
    @Req() req: Request,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const result = await this.productService.create(
      createProductDto,
      req.user!.id,
      files,
    );

    return {
      message: 'Product created successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @ApiBody({ type: UpdateProductDto })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard('supplier'))
  @UseInterceptors(FilesInterceptor('photos', 5, productImageUploadConfig))
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: Request,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const result = await this.productService.update(
      id,
      updateProductDto,
      req.user!.id,
      files,
    );

    return {
      message: 'Product updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @UseGuards(AuthGuard('supplier'))
  async remove(@Param('id') id: string, @Req() req: Request) {
    const result = await this.productService.remove(id, req.user!.id);

    return {
      message: 'Product deleted successfully',
      data: result,
    };
  }
}
