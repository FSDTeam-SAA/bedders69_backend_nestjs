import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { fileUpload } from 'src/app/helpers/fileUploder';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { AdvertisementService } from './advertisement.service';
import { AdminAdvertisementActionDto } from './dto/advertisement-action.dto';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';

@ApiTags('advertisements')
@Controller('advertisements')
export class AdvertisementController {
  constructor(private readonly advertisementService: AdvertisementService) {}

  @Post('create-advertisement')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Create an advertisement' })
  @ApiBody({ type: CreateAdvertisementDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async createAdvertisement(
    @Req() req: Request,
    @Body() dto: CreateAdvertisementDto,
  ) {
    const result = await this.advertisementService.createAdvertisement(
      req.user!.id,
      dto,
    );
    return { message: 'Advertisement created successfully', data: result };
  }

  @Post('upload-advertisement-asset/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Upload an advertisement asset' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: String, description: 'Advertisement ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        asset: { type: 'string', format: 'binary' },
      },
      required: ['asset'],
    },
  })
  @UseInterceptors(FileInterceptor('asset', fileUpload.uploadConfig))
  @ApiOkResponse({ description: 'Advertisement asset uploaded successfully' })
  @ApiNotFoundResponse({ description: 'Advertisement not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async uploadAdvertisementAsset(
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.advertisementService.uploadAdvertisementAsset(
      id,
      req.user!.id,
      file,
    );
    return {
      message: 'Advertisement asset uploaded successfully',
      data: result,
    };
  }

  @Patch('update-advertisement/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Update an advertisement' })
  @ApiParam({ name: 'id', type: String, description: 'Advertisement ID' })
  @ApiBody({ type: UpdateAdvertisementDto })
  @ApiOkResponse({ description: 'Advertisement updated successfully' })
  @ApiNotFoundResponse({ description: 'Advertisement not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async updateAdvertisement(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateAdvertisementDto,
  ) {
    const result = await this.advertisementService.updateAdvertisement(
      id,
      req.user!.id,
      dto,
    );
    return { message: 'Advertisement updated successfully', data: result };
  }

  @Get('get-my-advertisements')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Get my advertisements' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Advertisements fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getMyAdvertisements(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.advertisementService.getMyAdvertisements(
      req.user!.id,
      options,
    );
    return {
      message: 'Advertisements fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('serve-advertisements')
  @ApiOperation({
    summary: 'Serve active approved advertisements by placement',
  })
  @ApiQuery({ name: 'placement', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Advertisements fetched successfully' })
  @HttpCode(HttpStatus.OK)
  async serveAdvertisements(@Req() req: Request) {
    const filters = pick(req.query, ['placement']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.advertisementService.serveAdvertisements(
      filters,
      options,
    );
    return {
      message: 'Advertisements fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post('track-advertisement-impression/:id')
  @ApiOperation({ summary: 'Track an advertisement impression' })
  @ApiParam({ name: 'id', type: String, description: 'Advertisement ID' })
  @ApiOkResponse({ description: 'Advertisement impression tracked' })
  @ApiNotFoundResponse({ description: 'Advertisement not found' })
  @HttpCode(HttpStatus.OK)
  async trackAdvertisementImpression(@Param('id') id: string) {
    const result =
      await this.advertisementService.trackAdvertisementImpression(id);
    return { message: 'Advertisement impression tracked', data: result };
  }

  @Post('track-advertisement-click/:id')
  @ApiOperation({ summary: 'Track an advertisement click' })
  @ApiParam({ name: 'id', type: String, description: 'Advertisement ID' })
  @ApiOkResponse({ description: 'Advertisement click tracked' })
  @ApiNotFoundResponse({ description: 'Advertisement not found' })
  @HttpCode(HttpStatus.OK)
  async trackAdvertisementClick(@Param('id') id: string) {
    const result = await this.advertisementService.trackAdvertisementClick(id);
    return { message: 'Advertisement click tracked', data: result };
  }

  @Get('admin/get-advertisements')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Admin get advertisements' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'placement', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Advertisements fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getAdminAdvertisements(@Req() req: Request) {
    const filters = pick(req.query, ['status', 'placement', 'search']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.advertisementService.getAdminAdvertisements(
      filters,
      options,
    );
    return {
      message: 'Advertisements fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post('admin/approve-advertisement')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Approve an advertisement (admin)' })
  @ApiBody({ type: AdminAdvertisementActionDto })
  @ApiOkResponse({ description: 'Advertisement approved successfully' })
  @ApiNotFoundResponse({ description: 'Advertisement not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async approveAdvertisement(
    @Req() req: Request,
    @Body() dto: AdminAdvertisementActionDto,
  ) {
    const result = await this.advertisementService.approveAdvertisement(
      req.user!.id,
      dto.advertisementId,
      dto.reason,
    );
    return { message: 'Advertisement approved successfully', data: result };
  }

  @Post('admin/reject-advertisement')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Reject an advertisement (admin)' })
  @ApiBody({ type: AdminAdvertisementActionDto })
  @ApiOkResponse({ description: 'Advertisement rejected successfully' })
  @ApiNotFoundResponse({ description: 'Advertisement not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async rejectAdvertisement(
    @Req() req: Request,
    @Body() dto: AdminAdvertisementActionDto,
  ) {
    const result = await this.advertisementService.rejectAdvertisement(
      req.user!.id,
      dto.advertisementId,
      dto.reason,
    );
    return { message: 'Advertisement rejected successfully', data: result };
  }
}
