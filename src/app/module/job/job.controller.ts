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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
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
import AuthGuard from '../../middlewares/auth.guard';
import { AdminJobActionDto } from '../job-application/dto/job-application.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobService } from './job.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post('create-job')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiBody({ type: CreateJobDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async createJob(@Req() req: Request, @Body() dto: CreateJobDto) {
    const result = await this.jobService.createJob(req.user!.id, dto);
    return { message: 'Job created successfully', data: result };
  }

  @Patch('update-job/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Update a job posting' })
  @ApiParam({ name: 'id', type: String, description: 'Job ID' })
  @ApiBody({ type: UpdateJobDto })
  @ApiOkResponse({ description: 'Job updated successfully' })
  @ApiNotFoundResponse({ description: 'Job not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async updateJob(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateJobDto,
  ) {
    const result = await this.jobService.updateJob(id, req.user!.id, dto);
    return { message: 'Job updated successfully', data: result };
  }

  @Patch('publish-job/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Submit job for admin approval' })
  @ApiParam({ name: 'id', type: String, description: 'Job ID' })
  @ApiOkResponse({ description: 'Job submitted for approval' })
  @ApiNotFoundResponse({ description: 'Job not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async publishJob(@Param('id') id: string, @Req() req: Request) {
    const result = await this.jobService.publishJob(id, req.user!.id);
    return { message: 'Job submitted for admin approval', data: result };
  }

  @Patch('close-job/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Close a job posting' })
  @ApiParam({ name: 'id', type: String, description: 'Job ID' })
  @ApiOkResponse({ description: 'Job closed successfully' })
  @ApiNotFoundResponse({ description: 'Job not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async closeJob(@Param('id') id: string, @Req() req: Request) {
    const result = await this.jobService.closeJob(id, req.user!.id);
    return { message: 'Job closed successfully', data: result };
  }

  @Get('get-my-jobs')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Get my posted jobs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Jobs fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getMyJobs(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.jobService.getMyJobs(req.user!.id, options);
    return {
      message: 'Jobs fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('search-jobs')
  @ApiOperation({ summary: 'Search approved public jobs' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'postCode', required: false, type: String })
  @ApiQuery({ name: 'jobType', required: false, type: String })
  @ApiQuery({ name: 'requiredSkills', required: false, type: String })
  @ApiQuery({ name: 'minExperience', required: false, type: Number })
  @ApiQuery({ name: 'salaryMin', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Jobs fetched successfully' })
  @HttpCode(HttpStatus.OK)
  async searchJobs(@Req() req: Request) {
    const filters = pick(req.query, [
      'search',
      'city',
      'postCode',
      'jobType',
      'requiredSkills',
      'minExperience',
      'salaryMin',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.jobService.searchJobs(filters, options);
    return {
      message: 'Jobs fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('get-job/:id')
  @ApiOperation({ summary: 'Get a single job by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Job ID' })
  @ApiOkResponse({ description: 'Job fetched successfully' })
  @ApiNotFoundResponse({ description: 'Job not found' })
  @HttpCode(HttpStatus.OK)
  async getJob(@Param('id') id: string) {
    const result = await this.jobService.getJob(id);
    return { message: 'Job fetched successfully', data: result };
  }

  @Post('save-job/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('carer'))
  async saveJob(@Param('id') id: string, @Req() req: Request) {
    const result = await this.jobService.saveJob(req.user!.id, id);
    return { message: 'Job saved successfully', data: result };
  }

  @Get('get-my-saved-jobs')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('carer'))
  async getMySavedJobs(@Req() req: Request) {
    const result = await this.jobService.getSavedJobs(req.user!.id);
    return { message: 'Saved jobs fetched successfully', data: result };
  }

  @Patch('unsave-job/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('carer'))
  async unsaveJob(@Param('id') id: string, @Req() req: Request) {
    const result = await this.jobService.removeSavedJob(req.user!.id, id);
    return { message: 'Job removed from saved jobs', data: result };
  }

  @Get('admin/get-jobs')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Admin get all jobs' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Jobs fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getAdminJobs(@Req() req: Request) {
    const filters = pick(req.query, ['status', 'search']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.jobService.getAdminJobs(filters, options);
    return {
      message: 'Jobs fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post('admin/approve-job')
  @Patch('admin/approve-job')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Approve a job posting (admin)' })
  @ApiBody({ type: AdminJobActionDto })
  @ApiOkResponse({ description: 'Job approved successfully' })
  @ApiNotFoundResponse({ description: 'Job not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async approveJob(@Req() req: Request, @Body() dto: AdminJobActionDto) {
    const result = await this.jobService.approveJob(
      req.user!.id,
      dto.jobId,
      dto.reason,
    );
    return { message: 'Job approved successfully', data: result };
  }

  @Post('admin/reject-job')
  @Patch('admin/reject-job')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Reject a job posting (admin)' })
  @ApiBody({ type: AdminJobActionDto })
  @ApiOkResponse({ description: 'Job rejected successfully' })
  @ApiNotFoundResponse({ description: 'Job not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async rejectJob(@Req() req: Request, @Body() dto: AdminJobActionDto) {
    const result = await this.jobService.rejectJob(
      req.user!.id,
      dto.jobId,
      dto.reason,
    );
    return { message: 'Job rejected successfully', data: result };
  }
}
