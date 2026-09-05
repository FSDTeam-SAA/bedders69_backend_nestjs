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
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';
import { fileUpload } from '../../helpers/fileUploder';
import AuthGuard from '../../middlewares/auth.guard';
import { CompanyService } from './company.service';
import {
  CreateContactRequestDto,
  UpdateContactRequestStatusDto,
} from './dto/create-contact-request.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateSavedCarerDto } from './dto/create-saved-carer.dto';
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
  @ApiBody({ type: CreateCompanyDto })
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

  @Post('save-carer')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('care_company', 'agency', 'supplier', 'service_provider', 'family'))
  @ApiOperation({ summary: 'Save/Bookmark a carer' })
  @ApiBody({ type: CreateSavedCarerDto })
  @HttpCode(HttpStatus.CREATED)
  async saveCarer(@Req() req: Request, @Body() dto: CreateSavedCarerDto) {
    const result = await this.companyService.saveCarer(req.user!.id, dto);
    return {
      message: 'Carer saved successfully',
      data: result,
    };
  }

  @Get('get-saved-carers')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('care_company', 'agency', 'supplier', 'service_provider', 'family'))
  @ApiOperation({ summary: 'Get all saved carers for current company' })
  @HttpCode(HttpStatus.OK)
  async getSavedCarers(@Req() req: Request) {
    const result = await this.companyService.getSavedCarers(req.user!.id);
    return {
      message: 'Saved carers fetched successfully',
      data: result,
    };
  }

  @Get('get-saved-carers/:carerId')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('care_company', 'agency', 'supplier', 'service_provider', 'family'))
  @ApiOperation({ summary: 'Get a specific saved carer detail' })
  @ApiParam({ name: 'carerId', type: String })
  @HttpCode(HttpStatus.OK)
  async getSavedCarerById(@Req() req: Request, @Param('carerId') carerId: string) {
    const result = await this.companyService.getSavedCarerById(req.user!.id, carerId);
    return {
      message: 'Saved carer detail fetched successfully',
      data: result,
    };
  }

  @Delete('remove-saved-carer/:carerId')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('care_company', 'agency', 'supplier', 'service_provider', 'family'))
  @ApiOperation({ summary: 'Remove a carer from saved list' })
  @ApiParam({ name: 'carerId', type: String })
  @HttpCode(HttpStatus.OK)
  async removeSavedCarer(@Req() req: Request, @Param('carerId') carerId: string) {
    const result = await this.companyService.removeSavedCarer(req.user!.id, carerId);
    return result;
  }

  @Get('get-contact-requests')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('care_company', 'agency', 'supplier', 'service_provider', 'family'))
  @ApiOperation({ summary: 'Get inbound contact requests for company' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @HttpCode(HttpStatus.OK)
  async getContactRequests(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const status = req.query.status as string | undefined;
    const result = await this.companyService.getContactRequests(
      req.user!.id,
      options,
      status,
    );
    return {
      message: 'Contact requests fetched successfully',
      meta: result.meta,
      counts: result.counts,
      data: result.data,
    };
  }

  @Post('create-contact-request')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('care_company', 'agency', 'supplier', 'service_provider', 'family', 'carer', 'admin'))
  @ApiOperation({ summary: 'Create a contact request' })
  @ApiBody({ type: CreateContactRequestDto })
  @HttpCode(HttpStatus.CREATED)
  async createContactRequest(
    @Req() req: Request,
    @Body() dto: CreateContactRequestDto,
  ) {
    const userId = req.user!.id;
    const result = await this.companyService.createContactRequest(
      userId,
      dto,
    );
    return {
      message: 'Contact request created successfully',
      data: result,
    };
  }

  @Patch('update-contact-request/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('care_company', 'agency', 'supplier', 'service_provider', 'family'))
  @ApiOperation({ summary: 'Update contact request status (Accepted/Rejected)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateContactRequestStatusDto })
  @HttpCode(HttpStatus.OK)
  async updateContactRequestStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateContactRequestStatusDto,
  ) {
    const result = await this.companyService.updateContactRequestStatus(
      req.user!.id,
      id,
      dto.status,
    );
    return {
      message: 'Contact request status updated successfully',
      data: result,
    };
  }

  @Get('dashboard-overview')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('care_company', 'agency', 'supplier', 'service_provider', 'family'))
  @ApiOperation({ summary: 'Get dashboard overview statistics and recent applicants' })
  @HttpCode(HttpStatus.OK)
  async getDashboardOverview(@Req() req: Request) {
    const result = await this.companyService.getDashboardOverview(req.user!.id);
    return {
      message: 'Dashboard overview fetched successfully',
      data: result,
    };
  }
}
