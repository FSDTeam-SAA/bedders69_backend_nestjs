import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { fileUpload } from '../../helpers/fileUploder';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';

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
}
