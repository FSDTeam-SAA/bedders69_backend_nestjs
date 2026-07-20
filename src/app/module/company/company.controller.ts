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
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('Company')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new care company',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'coverPhoto', maxCount: 1 },
        { name: 'cvResume', maxCount: 1 },
        { name: 'supportingDocuments', maxCount: 10 },
      ],
      fileUpload.uploadConfig,
    ),
  )
  @HttpCode(HttpStatus.CREATED)
  async createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
    @UploadedFiles()
    files?: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      cvResume?: Express.Multer.File[];
      supportingDocuments?: Express.Multer.File[];
    },
  ) {
    const result = await this.companyService.createCompany(
      createCompanyDto,
      files,
    );
    return {
      message: 'Care company created successfully',
      data: result,
    };
  }

  @Get('get-my-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('care_company'))
  @ApiOperation({
    summary: 'Get my care company profile',
    description: 'Returns the profile for the authenticated care company user.',
  })
  @ApiOkResponse({
    description: 'Care company profile fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'Care company profile fetched successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          userId: '65f1c9f234df3c9342a58f01',
          companyName: 'Bedders Care Ltd',
          email: 'company@example.com',
          phoneNumber: '+447700900123',
          registerNumber: 'REG-123',
          address: '221B Baker Street',
          postCode: 'SW1A 1AA',
          status: 'pending',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Care company profile not found' })
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@Req() req: Request) {
    const result = await this.companyService.getMyProfile(req.user!.id);
    return {
      message: 'Care company profile fetched successfully',
      data: result,
    };
  }

  @Patch('update-my-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('care_company'))
  @ApiOperation({
    summary: 'Update my care company profile',
    description: 'Updates the profile for the authenticated care company user.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateCompanyDto })
  @ApiOkResponse({
    description: 'Care company profile updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Care company profile updated successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          companyName: 'Updated Care Ltd',
          phoneNumber: '+447700900999',
          address: 'New Address',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Care company profile not found' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'coverPhoto', maxCount: 1 },
        { name: 'cvResume', maxCount: 1 },
        { name: 'supportingDocuments', maxCount: 10 },
      ],
      fileUpload.uploadConfig,
    ),
  )
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @Req() req: Request,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @UploadedFiles()
    files?: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      cvResume?: Express.Multer.File[];
      supportingDocuments?: Express.Multer.File[];
    },
  ) {
    const result = await this.companyService.updateMyProfile(
      req.user!.id,
      updateCompanyDto,
      files,
    );
    return {
      message: 'Care company profile updated successfully',
      data: result,
    };
  }
}
