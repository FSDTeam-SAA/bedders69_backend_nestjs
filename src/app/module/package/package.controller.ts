import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';

@ApiTags('packages')
@Controller('packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post('admin/create-package')
  @ApiOperation({ summary: 'Create a new package (admin)' })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreatePackageDto })
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async createPackage(@Body() createPackageDto: CreatePackageDto) {
    const result = await this.packageService.createPackage(createPackageDto);
    return {
      message: 'Package created successfully',
      data: result,
    };
  }

  @Patch('admin/update-package/:id')
  @ApiOperation({ summary: 'Update a package (admin)' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiBody({ type: UpdatePackageDto })
  @UseGuards(AuthGuard('admin'))
  async updatePackage(
    @Param('id') id: string,
    @Body() updatePackageDto: UpdatePackageDto,
  ) {
    const result = await this.packageService.updatePackage(
      id,
      updatePackageDto,
    );
    return {
      message: 'Package updated successfully',
      data: result,
    };
  }

  @Patch('admin/disable-package/:id')
  @ApiOperation({ summary: 'Disable a package (admin)' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Package ID' })
  @UseGuards(AuthGuard('admin'))
  async disablePackage(@Param('id') id: string) {
    const result = await this.packageService.disablePackage(id);
    return {
      message: 'Package disabled successfully',
      data: result,
    };
  }

  @Get('get-packages')
  @ApiOperation({ summary: 'Get all active packages (public)' })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    description: 'Search by name, description, or type',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: [
      'membership',
      'job_posting',
      'marketplace_listing',
      'advertisement',
      'premium_profile',
    ],
    description: 'Filter by package type',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @HttpCode(HttpStatus.OK)
  async getPackages(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'type']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.packageService.getPackages(filters, options);
    return {
      message: 'Packages retrieved successfully',
      data: result,
    };
  }

  @Get('get-all-packages')
  @ApiOperation({ summary: 'Get all packages including inactive (admin)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @HttpCode(HttpStatus.OK)
  async getAllPackages(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'type']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.packageService.getAllPackages(filters, options);
    return {
      message: 'All packages retrieved successfully',
      data: result,
    };
  }

  @Get('get-package/:id')
  @ApiOperation({ summary: 'Get a single package by ID (public)' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @HttpCode(HttpStatus.OK)
  async getPackage(@Param('id') id: string) {
    const result = await this.packageService.getPackage(id);
    return {
      message: 'Package retrieved successfully',
      data: result,
    };
  }
}
