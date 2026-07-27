import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { fileUpload } from '../../helpers/fileUploder';
import AuthGuard from '../../middlewares/auth.guard';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FamilyService } from './family.service';

@ApiTags('Family')
@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new family',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profilePicture', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createFamily(
    @Body() createFamilyDto: CreateFamilyDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.familyService.createFamily(createFamilyDto, file);
    return {
      message: 'Family created successfully',
      data: result,
    };
  }

  @Get('get-my-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('family'))
  @ApiOperation({
    summary: 'Get my family profile',
    description: 'Returns the profile for the authenticated family user.',
  })
  @ApiOkResponse({
    description: 'Family profile fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'Family profile fetched successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          userId: '65f1c9f234df3c9342a58f01',
          firstName: 'Jane',
          lastName: 'Family',
          email: 'family@example.com',
          phoneNumber: '+447700900123',
          postCode: 'SW1A 1AA',
          city: 'London',
          street: 'Downing Street',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Family profile not found' })
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@Req() req: Request) {
    const result = await this.familyService.getMyProfile(req.user!.id);
    return {
      message: 'Family profile fetched successfully',
      data: result,
    };
  }

  @Patch('update-my-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('family'))
  @ApiOperation({
    summary: 'Update my family profile',
    description: 'Updates the profile for the authenticated family user.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateFamilyDto })
  @ApiOkResponse({
    description: 'Family profile updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Family profile updated successfully',
        data: {
          _id: '65f1c9f234df3c9342a58f00',
          firstName: 'Jane',
          lastName: 'Updated',
          city: 'Manchester',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Family profile not found' })
  @UseInterceptors(FileInterceptor('profilePicture', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @Req() req: Request,
    @Body() updateFamilyDto: UpdateFamilyDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.familyService.updateMyProfile(
      req.user!.id,
      updateFamilyDto,
      file,
    );
    return {
      message: 'Family profile updated successfully',
      data: result,
    };
  }
}
