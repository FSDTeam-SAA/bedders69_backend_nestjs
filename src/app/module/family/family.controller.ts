import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { fileUpload } from '../../helpers/fileUploder';
import { CreateFamilyDto } from './dto/create-family.dto';
import { FamilyService } from './family.service';

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
}
