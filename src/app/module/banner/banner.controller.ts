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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { fileUpload } from 'src/app/helpers/fileUploder';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@ApiTags('banner')
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new banner' })
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({ type: CreateBannerDto })
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createBanner(
    @Body() createBannerDto: CreateBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.bannerService.createBanner(createBannerDto, file);
    return {
      message: 'Banner created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all banners' })
  async getAllBanners(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.bannerService.getAllBanners(options);
    return {
      message: 'Banners retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single banner by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Banner ID' })
  async getSingleBanner(@Param('id') id: string) {
    const result = await this.bannerService.getSingleBanner(id);
    return {
      message: 'Banner retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update banner' })
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiParam({ name: 'id', type: String, description: 'Banner ID' })
  @ApiBody({ type: UpdateBannerDto })
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  async updateBanner(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.bannerService.updateBanner(id, updateBannerDto, file);
    return {
      message: 'Banner updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete banner' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, description: 'Banner ID' })
  @UseGuards(AuthGuard('admin'))
  async deleteBanner(@Param('id') id: string) {
    const result = await this.bannerService.deleteBanner(id);
    return {
      message: 'Banner deleted successfully',
      data: result,
    };
  }
}
