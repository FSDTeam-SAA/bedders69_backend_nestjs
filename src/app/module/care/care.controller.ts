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
import { CareService } from './care.service';
import { CreateCareDto } from './dto/create-care.dto';
import { UpdateCareDto } from './dto/update-care.dto';

@ApiTags('Care')
@Controller('care')
export class CareController {
  constructor(private readonly careService: CareService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new care' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateCareDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profilePicture', maxCount: 1 },
        { name: 'cv', maxCount: 1 },
        { name: 'dbsCertificate', maxCount: 1 },
        { name: 'careCertificate', maxCount: 1 },
        { name: 'trainingCertificates', maxCount: 5 },
        { name: 'firstAidCertificate', maxCount: 1 },
        { name: 'qualificationCertificates', maxCount: 5 },
        { name: 'documents', maxCount: 10 },
      ],
      fileUpload.uploadConfig,
    ),
  )
  @HttpCode(HttpStatus.CREATED)
  async createCare(
    @Body() createCareDto: CreateCareDto,
    @UploadedFiles()
    files?: {
      profilePicture?: Express.Multer.File[];
      cv?: Express.Multer.File[];
      dbsCertificate?: Express.Multer.File[];
      careCertificate?: Express.Multer.File[];
      trainingCertificates?: Express.Multer.File[];
      firstAidCertificate?: Express.Multer.File[];
      qualificationCertificates?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
  ) {
    const result = await this.careService.createCare(createCareDto, files);
    return {
      message: 'Care created successfully',
      data: result,
    };
  }

  @Get('get-my-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('carer'))
  @ApiOperation({
    summary: 'Get my carer profile',
    description: 'Returns the profile for the authenticated carer user.',
  })
  @ApiOkResponse({
    description: 'Carer profile fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'Carer profile fetched successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          userId: '65f1c9f234df3c9342a58f01',
          careName: 'Jane Carer',
          email: 'carer@example.com',
          phoneNumber: '+447700900123',
          postCode: 'SW1A 1AA',
          shifts: 'Day',
          isAvailable: true,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Carer profile not found' })
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@Req() req: Request) {
    const result = await this.careService.getMyProfile(req.user!.id);
    return {
      message: 'Carer profile fetched successfully',
      data: result,
    };
  }

  @Patch('update-my-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('carer'))
  @ApiOperation({
    summary: 'Update my carer profile',
    description: 'Updates the profile for the authenticated carer user.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateCareDto })
  @ApiOkResponse({
    description: 'Carer profile updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Carer profile updated successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          careName: 'Updated Carer',
          phoneNumber: '+447700900999',
          address: 'New Address',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Carer profile not found' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profilePicture', maxCount: 1 },
        { name: 'cv', maxCount: 1 },
        { name: 'dbsCertificate', maxCount: 1 },
        { name: 'careCertificate', maxCount: 1 },
        { name: 'trainingCertificates', maxCount: 5 },
        { name: 'firstAidCertificate', maxCount: 1 },
        { name: 'qualificationCertificates', maxCount: 5 },
        { name: 'documents', maxCount: 10 },
      ],
      fileUpload.uploadConfig,
    ),
  )
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @Req() req: Request,
    @Body() updateCareDto: UpdateCareDto,
    @UploadedFiles()
    files?: {
      profilePicture?: Express.Multer.File[];
      cv?: Express.Multer.File[];
      dbsCertificate?: Express.Multer.File[];
      careCertificate?: Express.Multer.File[];
      trainingCertificates?: Express.Multer.File[];
      firstAidCertificate?: Express.Multer.File[];
      qualificationCertificates?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
  ) {
    const result = await this.careService.updateMyProfile(
      req.user!.id,
      updateCareDto,
      files,
    );
    return {
      message: 'Carer profile updated successfully',
      data: result,
    };
  }
}
