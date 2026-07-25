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
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { ServiceProviderService } from './service-provider.service';

const serviceProviderFileFields = [
  { name: 'logo', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 },
];

@ApiTags('Service Provider')
@Controller('service-provider')
export class ServiceProviderController {
  constructor(
    private readonly serviceProviderService: ServiceProviderService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service provider' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateServiceProviderDto })
  @UseInterceptors(
    FileFieldsInterceptor(serviceProviderFileFields, fileUpload.uploadConfig),
  )
  @HttpCode(HttpStatus.CREATED)
  async createServiceProvider(
    @Body() createServiceProviderDto: CreateServiceProviderDto,
    @UploadedFiles()
    files?: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
    },
  ) {
    const result = await this.serviceProviderService.createServiceProvider(
      createServiceProviderDto,
      files,
    );
    return {
      message: 'Service provider created successfully',
      data: result,
    };
  }

  @Get('get-my-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('service_provider'))
  @ApiOperation({
    summary: 'Get my service provider profile',
    description:
      'Returns the profile for the authenticated service provider user.',
  })
  @ApiOkResponse({
    description: 'Service provider profile fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'Service provider profile fetched successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          userId: '65f1c9f234df3c9342a58f01',
          name: 'John Doe',
          email: 'provider@example.com',
          phoneNumber: '+8801700000000',
          companyName: 'ABC Services Ltd',
          serviceCoverArea: 'Dhaka, Gazipur',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Service provider profile not found' })
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@Req() req: Request) {
    const result = await this.serviceProviderService.getMyProfile(req.user!.id);
    return {
      message: 'Service provider profile fetched successfully',
      data: result,
    };
  }

  @Patch('update-my-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('service_provider'))
  @ApiOperation({
    summary: 'Update my service provider profile',
    description:
      'Updates the profile for the authenticated service provider user.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateServiceProviderDto })
  @ApiOkResponse({
    description: 'Service provider profile updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Service provider profile updated successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          companyName: 'Updated Services Ltd',
          phoneNumber: '+8801700000999',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Service provider profile not found' })
  @UseInterceptors(
    FileFieldsInterceptor(serviceProviderFileFields, fileUpload.uploadConfig),
  )
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @Req() req: Request,
    @Body() updateServiceProviderDto: UpdateServiceProviderDto,
    @UploadedFiles()
    files?: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
    },
  ) {
    const result = await this.serviceProviderService.updateMyProfile(
      req.user!.id,
      updateServiceProviderDto,
      files,
    );
    return {
      message: 'Service provider profile updated successfully',
      data: result,
    };
  }
}
