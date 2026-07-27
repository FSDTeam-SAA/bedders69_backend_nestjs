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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoryService } from './product-category.service';

@ApiTags('product-category')
@Controller('product-categories')
export class ProductCategoryController {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create product category' })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateProductCategoryDto })
  @UseGuards(AuthGuard('supplier'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProductCategoryDto: CreateProductCategoryDto,
    @Req() req: Request,
  ) {
    const result = await this.productCategoryService.create(
      createProductCategoryDto,
      req.user!.id,
    );

    return {
      message: 'Product category created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all product categories' })
  async findAll() {
    const result = await this.productCategoryService.findAll();

    return {
      message: 'Product categories retrieved successfully',
      data: result,
    };
  }

  @Get('supplier/:supplierId')
  @ApiOperation({ summary: 'Get product categories by supplier id' })
  @ApiParam({ name: 'supplierId', type: String, description: 'Supplier ID' })
  async findBySupplierId(@Param('supplierId') supplierId: string) {
    const result =
      await this.productCategoryService.findBySupplierId(supplierId);

    return {
      message: 'Supplier categories retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product category' })
  @ApiParam({ name: 'id', type: String, description: 'Product category ID' })
  async findOne(@Param('id') id: string) {
    const result = await this.productCategoryService.findOne(id);

    return {
      message: 'Product category retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product category' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, description: 'Product category ID' })
  @ApiBody({ type: UpdateProductCategoryDto })
  @UseGuards(AuthGuard('supplier'))
  async update(
    @Param('id') id: string,
    @Body() updateProductCategoryDto: UpdateProductCategoryDto,
    @Req() req: Request,
  ) {
    const result = await this.productCategoryService.update(
      id,
      updateProductCategoryDto,
      req.user!.id,
    );

    return {
      message: 'Product category updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product category' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, description: 'Product category ID' })
  @UseGuards(AuthGuard('supplier'))
  async remove(@Param('id') id: string, @Req() req: Request) {
    const result = await this.productCategoryService.remove(id, req.user!.id);

    return {
      message: 'Product category deleted successfully',
      data: result,
    };
  }
}
