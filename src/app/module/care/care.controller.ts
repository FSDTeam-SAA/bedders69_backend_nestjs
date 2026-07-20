import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { fileUpload } from '../../helpers/fileUploder';
import { CareService } from './care.service';
import { CreateCareDto } from './dto/create-care.dto';

@ApiTags('Care')
@Controller('care')
export class CareController {
  constructor(private readonly careService: CareService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new care' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor(fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createCare(
    @Body() createCareDto: CreateCareDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const result = await this.careService.createCare(createCareDto, files);
    return {
      message: 'Care created successfully',
      data: result,
    };
  }
}
