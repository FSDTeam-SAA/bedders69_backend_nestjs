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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceService } from './service.service';

@ApiTags('service')
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @ApiOperation({ summary: 'Create service' })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateServiceDto })
  @UseGuards(AuthGuard('service_provider'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createServiceDto: CreateServiceDto,
    @Req() req: Request,
  ) {
    const result = await this.serviceService.create(
      createServiceDto,
      req.user!.id,
    );

    return {
      message: 'Service created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  async findAll() {
    const result = await this.serviceService.findAll();

    return {
      message: 'Services retrieved successfully',
      data: result,
    };
  }

  @Get('provider/:providerId')
  @ApiOperation({ summary: 'Get services by provider id' })
  async getByProviderId(@Param('providerId') providerId: string) {
    const result = await this.serviceService.getByProviderId(providerId);

    return {
      message: 'Provider services retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single service' })
  async findOne(@Param('id') id: string) {
    const result = await this.serviceService.findOne(id);

    return {
      message: 'Service retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service' })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: UpdateServiceDto })
  @UseGuards(AuthGuard('service_provider'))
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Req() req: Request,
  ) {
    const result = await this.serviceService.update(
      id,
      updateServiceDto,
      req.user!.id,
    );

    return {
      message: 'Service updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('service_provider'))
  async remove(@Param('id') id: string, @Req() req: Request) {
    const result = await this.serviceService.remove(id, req.user!.id);

    return {
      message: 'Service deleted successfully',
      data: result,
    };
  }
}
