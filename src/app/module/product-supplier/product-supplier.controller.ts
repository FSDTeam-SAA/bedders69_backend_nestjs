import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { fileUpload } from '../../helpers/fileUploder';
import AuthGuard from '../../middlewares/auth.guard';
import { CreateProductSupplierDto } from './dto/create-product-supplier.dto';
import { UpdateProductSupplierDto } from './dto/update-product-supplier.dto';
import { ProductSupplierService } from './product-supplier.service';

const productSupplierFileFields = [
  { name: 'logo', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 },
];

@ApiTags('Product Supplier')
@Controller('product-supplier')
export class ProductSupplierController {
  constructor(
    private readonly productSupplierService: ProductSupplierService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product supplier' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProductSupplierDto })
  @UseInterceptors(
    FileFieldsInterceptor(productSupplierFileFields, fileUpload.uploadConfig),
  )
  @HttpCode(HttpStatus.CREATED)
  async createProductSupplier(
    @Body() createProductSupplierDto: CreateProductSupplierDto,
    @UploadedFiles()
    files?: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
    },
  ) {
    const result = await this.productSupplierService.createProductSupplier(
      createProductSupplierDto,
      files,
    );
    return {
      message: 'Product supplier created successfully',
      data: result,
    };
  }

  @Get('get-my-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('supplier'))
  @ApiOperation({
    summary: 'Get my product supplier profile',
    description:
      'Returns the profile for the authenticated product supplier user.',
  })
  @ApiOkResponse({
    description: 'Product supplier profile fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'Product supplier profile fetched successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          userId: '65f1c9f234df3c9342a58f01',
          name: 'John Doe',
          email: 'supplier@example.com',
          phoneNumber: '+8801700000000',
          storeName: 'ABC Supplies Store',
          state: 'Dhaka',
          country: 'Bangladesh',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Product supplier profile not found' })
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@Req() req: Request) {
    const result = await this.productSupplierService.getMyProfile(req.user!.id);
    return {
      message: 'Product supplier profile fetched successfully',
      data: result,
    };
  }

  @Patch('update-my-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('supplier'))
  @ApiOperation({
    summary: 'Update my product supplier profile',
    description:
      'Updates the profile for the authenticated product supplier user.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProductSupplierDto })
  @ApiOkResponse({
    description: 'Product supplier profile updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Product supplier profile updated successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          storeName: 'Updated Supplies Store',
          phoneNumber: '+8801700000999',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Product supplier profile not found' })
  @UseInterceptors(
    FileFieldsInterceptor(productSupplierFileFields, fileUpload.uploadConfig),
  )
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @Req() req: Request,
    @Body() updateProductSupplierDto: UpdateProductSupplierDto,
    @UploadedFiles()
    files?: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
    },
  ) {
    const result = await this.productSupplierService.updateMyProfile(
      req.user!.id,
      updateProductSupplierDto,
      files,
    );
    return {
      message: 'Product supplier profile updated successfully',
      data: result,
    };
  }
}
