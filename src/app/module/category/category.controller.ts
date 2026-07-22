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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('category')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  async findAll() {
    const result = await this.categoryService.findAll();

    return {
      message: 'Categories retrieved successfully',
      data: result,
    };
  }

  @Get('supplier/:supplierId')
  @ApiOperation({ summary: 'Get categories by supplier id' })
  async findBySupplierId(@Param('supplierId') supplierId: string) {
    const result = await this.categoryService.findBySupplierId(supplierId);

    return {
      message: 'Supplier categories retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single category' })
  async findOne(@Param('id') id: string) {
    const result = await this.categoryService.findOne(id);

    return {
      message: 'Category retrieved successfully',
      data: result,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create category' })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateCategoryDto })
  @UseGuards(AuthGuard('supplier'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() req: Request,
  ) {
    const result = await this.categoryService.create(
      createCategoryDto,
      req.user!.id,
    );

    return {
      message: 'Category created successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: UpdateCategoryDto })
  @UseGuards(AuthGuard('supplier'))
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: Request,
  ) {
    const result = await this.categoryService.update(
      id,
      updateCategoryDto,
      req.user!.id,
    );

    return {
      message: 'Category updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('supplier'))
  async remove(@Param('id') id: string, @Req() req: Request) {
    const result = await this.categoryService.remove(id, req.user!.id);

    return {
      message: 'Category deleted successfully',
      data: result,
    };
  }
}
