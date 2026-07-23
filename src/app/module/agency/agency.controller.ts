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
import { AgencyService } from './agency.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';

@ApiTags('Agency')
@Controller('agency')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agency' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateAgencyDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'documents', maxCount: 10 }],
      fileUpload.uploadConfig,
    ),
  )
  @HttpCode(HttpStatus.CREATED)
  async createAgency(
    @Body() createAgencyDto: CreateAgencyDto,
    @UploadedFiles()
    files?: {
      documents?: Express.Multer.File[];
    },
  ) {
    const result = await this.agencyService.createAgency(
      createAgencyDto,
      files,
    );
    return {
      message: 'Agency created successfully',
      data: result,
    };
  }

  @Get('get-my-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('agency'))
  @ApiOperation({
    summary: 'Get my agency profile',
    description: 'Returns the profile for the authenticated agency user.',
  })
  @ApiOkResponse({
    description: 'Agency profile fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'Agency profile fetched successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          userId: '65f1c9f234df3c9342a58f01',
          name: 'ABC Care Agency',
          email: 'info@abccare.com',
          phoneNumber: '+8801712345678',
          registerNumber: 'REG-123456',
          address: 'House-12, Road-5, Dhanmondi, Dhaka',
          status: 'pending',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Agency profile not found' })
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@Req() req: Request) {
    const result = await this.agencyService.getMyProfile(req.user!.id);
    return {
      message: 'Agency profile fetched successfully',
      data: result,
    };
  }

  @Patch('update-my-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('agency'))
  @ApiOperation({
    summary: 'Update my agency profile',
    description: 'Updates the profile for the authenticated agency user.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateAgencyDto })
  @ApiOkResponse({
    description: 'Agency profile updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Agency profile updated successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          name: 'Updated Care Agency',
          phoneNumber: '+8801700000000',
          address: 'New Address',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Agency profile not found' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'documents', maxCount: 10 }],
      fileUpload.uploadConfig,
    ),
  )
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @Req() req: Request,
    @Body() updateAgencyDto: UpdateAgencyDto,
    @UploadedFiles()
    files?: {
      documents?: Express.Multer.File[];
    },
  ) {
    const result = await this.agencyService.updateMyProfile(
      req.user!.id,
      updateAgencyDto,
      files,
    );
    return {
      message: 'Agency profile updated successfully',
      data: result,
    };
  }
}
