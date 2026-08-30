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
import {
  ApplyToJobDto,
  UpdateApplicationStatusDto,
} from './dto/job-application.dto';
import { JobApplicationService } from './job-application.service';

@ApiTags('job-applications')
@Controller('job-applications')
export class JobApplicationController {
  constructor(private readonly jobApplicationService: JobApplicationService) {}

  @Post('apply-to-job/:jobId')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('carer'))
  @ApiOperation({ summary: 'Apply to a job' })
  @ApiParam({ name: 'jobId', type: String, description: 'Job ID' })
  @ApiBody({ type: ApplyToJobDto })
  @ApiOkResponse({ description: 'Application submitted successfully' })
  @ApiNotFoundResponse({ description: 'Job not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async applyToJob(
    @Param('jobId') jobId: string,
    @Req() req: Request,
    @Body() dto: ApplyToJobDto,
  ) {
    const result = await this.jobApplicationService.applyToJob(
      req.user!.id,
      jobId,
      dto.coverLetter,
    );
    return { message: 'Application submitted successfully', data: result };
  }

  @Get('get-my-applications')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('carer'))
  @ApiOperation({ summary: 'Get my job applications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Applications fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getMyApplications(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.jobApplicationService.getMyApplications(
      req.user!.id,
      options,
    );
    return {
      message: 'Applications fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Patch('withdraw-application/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('carer'))
  @ApiOperation({ summary: 'Withdraw a job application' })
  @ApiParam({ name: 'id', type: String, description: 'Application ID' })
  @ApiOkResponse({ description: 'Application withdrawn successfully' })
  @ApiNotFoundResponse({ description: 'Application not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async withdrawApplication(@Param('id') id: string, @Req() req: Request) {
    const result = await this.jobApplicationService.withdrawApplication(
      id,
      req.user!.id,
    );
    return { message: 'Application withdrawn successfully', data: result };
  }

  @Get('get-job-applications/:jobId')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Get applications for a job (organization)' })
  @ApiParam({ name: 'jobId', type: String, description: 'Job ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Applications fetched successfully' })
  @ApiNotFoundResponse({ description: 'Job not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getJobApplications(@Param('jobId') jobId: string, @Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.jobApplicationService.getJobApplications(
      jobId,
      req.user!.id,
      options,
    );
    return {
      message: 'Applications fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('get-application-detail/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Get application detail (organization)' })
  @ApiParam({ name: 'id', type: String, description: 'Application ID' })
  @ApiOkResponse({ description: 'Application fetched successfully' })
  @ApiNotFoundResponse({ description: 'Application not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getApplicationDetail(@Param('id') id: string, @Req() req: Request) {
    const result = await this.jobApplicationService.getApplicationDetail(
      id,
      req.user!.id,
    );
    return { message: 'Application fetched successfully', data: result };
  }

  @Get('get-organization-applicants')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Get all applicants for current organization' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Applicants fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getOrganizationApplicants(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result =
      await this.jobApplicationService.getOrganizationApplicants(
        req.user!.id,
        options,
      );
    return {
      message: 'Applicants fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post('create-applicant')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Create applicant profile' })
  @ApiOkResponse({ description: 'Applicant created successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async createApplicant(@Req() req: Request, @Body() dto: any) {
    const result =
      await this.jobApplicationService.createOrganizationApplicant(
        req.user!.id,
        dto,
      );
    return {
      message: 'Applicant created successfully',
      data: result,
    };
  }

  @Patch('update-application-status/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Update application status (organization)' })
  @ApiParam({ name: 'id', type: String, description: 'Application ID' })
  @ApiBody({ type: UpdateApplicationStatusDto })
  @ApiOkResponse({ description: 'Application status updated' })
  @ApiNotFoundResponse({ description: 'Application not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async updateApplicationStatus(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    const result = await this.jobApplicationService.updateApplicationStatus(
      id,
      req.user!.id,
      dto.status,
      dto.reason,
    );
    return { message: 'Application status updated', data: result };
  }

  @Get('admin/get-applications')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Admin get all applications' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Applications fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getAdminApplications(@Req() req: Request) {
    const filters = pick(req.query, ['status', 'search']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.jobApplicationService.getAdminApplications(
      filters,
      options,
    );
    return {
      message: 'Applications fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }
}
