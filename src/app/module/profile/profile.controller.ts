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
import { AdminProfileActionDto } from './dto/admin-profile-action.dto';
import { CreateOrganizationProfileDto } from './dto/create-organization-profile.dto';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('search-care-companies')
  @ApiOperation({ summary: 'Search public care company directory' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'postCode', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Care companies fetched successfully' })
  @HttpCode(HttpStatus.OK)
  async searchCareCompanies(@Req() req: Request) {
    const filters = pick(req.query, ['search', 'postCode']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.profileService.searchCareCompanies(
      filters,
      options,
    );
    return {
      message: 'Care companies fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('search-recruitment-agencies')
  @ApiOperation({ summary: 'Search public recruitment agency directory' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'postCode', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Recruitment agencies fetched successfully' })
  @HttpCode(HttpStatus.OK)
  async searchRecruitmentAgencies(@Req() req: Request) {
    const filters = pick(req.query, ['search', 'city', 'postCode']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.profileService.searchOrganizationDirectory(
      'agency',
      filters,
      options,
    );
    return {
      message: 'Recruitment agencies fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('search-suppliers')
  @ApiOperation({ summary: 'Search public supplier directory' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'postCode', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Suppliers fetched successfully' })
  @HttpCode(HttpStatus.OK)
  async searchSuppliers(@Req() req: Request) {
    const filters = pick(req.query, ['search', 'city', 'postCode']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.profileService.searchOrganizationDirectory(
      'supplier',
      filters,
      options,
    );
    return {
      message: 'Suppliers fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('search-service-providers')
  @ApiOperation({ summary: 'Search public service provider directory' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'postCode', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Service providers fetched successfully' })
  @HttpCode(HttpStatus.OK)
  async searchServiceProviders(@Req() req: Request) {
    const filters = pick(req.query, ['search', 'city', 'postCode']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.profileService.searchOrganizationDirectory(
      'service_provider',
      filters,
      options,
    );
    return {
      message: 'Service providers fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('search-carers')
  @ApiOperation({ summary: 'Search public carer directory' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'postCode', required: false, type: String })
  @ApiQuery({ name: 'skills', required: false, type: String })
  @ApiQuery({ name: 'specialisms', required: false, type: String })
  @ApiQuery({ name: 'yearsOfExperience', required: false, type: Number })
  @ApiQuery({ name: 'isAvailable', required: false, type: Boolean })
  @ApiQuery({ name: 'hasDrivingLicense', required: false, type: Boolean })
  @ApiQuery({ name: 'hasVehicle', required: false, type: Boolean })
  @ApiQuery({ name: 'shifts', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Carers fetched successfully' })
  @HttpCode(HttpStatus.OK)
  async searchCarers(@Req() req: Request) {
    const filters = pick(req.query, [
      'search',
      'city',
      'postCode',
      'skills',
      'specialisms',
      'yearsOfExperience',
      'isAvailable',
      'hasDrivingLicense',
      'hasVehicle',
      'shifts',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.profileService.searchCarers(filters, options);
    return {
      message: 'Carers fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('search-restricted-carers')
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('care_company', 'agency', 'supplier', 'service_provider'),
  )
  @ApiOperation({ summary: 'Search restricted carer directory' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'skills', required: false, type: String })
  @ApiQuery({ name: 'specialisms', required: false, type: String })
  @ApiQuery({ name: 'yearsOfExperience', required: false, type: Number })
  @ApiQuery({ name: 'isAvailable', required: false, type: Boolean })
  @ApiQuery({ name: 'hasDrivingLicense', required: false, type: Boolean })
  @ApiQuery({ name: 'hasVehicle', required: false, type: Boolean })
  @ApiQuery({ name: 'shifts', required: false, type: String })
  @ApiQuery({ name: 'postCode', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Restricted carers fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async searchRestrictedCarers(@Req() req: Request) {
    const filters = pick(req.query, [
      'search',
      'city',
      'postCode',
      'skills',
      'specialisms',
      'yearsOfExperience',
      'isAvailable',
      'hasDrivingLicense',
      'hasVehicle',
      'shifts',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.profileService.searchRestrictedCarers(
      req.user!.id,
      filters,
      options,
    );
    return {
      message: 'Restricted carers fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post('create-recruitment-agency-profile')
  @ApiOperation({ summary: 'Create recruitment agency profile' })
  @ApiBody({ type: CreateOrganizationProfileDto })
  @HttpCode(HttpStatus.CREATED)
  async createRecruitmentAgencyProfile(
    @Body() dto: CreateOrganizationProfileDto,
  ) {
    const result = await this.profileService.createOrganizationProfile(
      'agency',
      dto,
    );
    return {
      message: 'Recruitment agency profile created successfully',
      data: result,
    };
  }

  @Get('get-my-recruitment-agency-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('agency'))
  @ApiOperation({ summary: 'Get my recruitment agency profile' })
  @ApiOkResponse({ description: 'Recruitment agency profile fetched' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Recruitment agency profile not found' })
  @HttpCode(HttpStatus.OK)
  async getMyRecruitmentAgencyProfile(@Req() req: Request) {
    const result = await this.profileService.getMyOrganizationProfile(
      req.user!.id,
      'agency',
    );
    return {
      message: 'Recruitment agency profile fetched successfully',
      data: result,
    };
  }

  @Patch('update-my-recruitment-agency-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('agency'))
  @ApiOperation({ summary: 'Update my recruitment agency profile' })
  @ApiBody({ type: UpdateOrganizationProfileDto })
  @ApiOkResponse({ description: 'Recruitment agency profile updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Recruitment agency profile not found' })
  @HttpCode(HttpStatus.OK)
  async updateMyRecruitmentAgencyProfile(
    @Req() req: Request,
    @Body() dto: UpdateOrganizationProfileDto,
  ) {
    const result = await this.profileService.updateMyOrganizationProfile(
      req.user!.id,
      'agency',
      dto,
    );
    return {
      message: 'Recruitment agency profile updated successfully',
      data: result,
    };
  }

  @Post('create-supplier-profile')
  @ApiOperation({ summary: 'Create supplier profile' })
  @ApiBody({ type: CreateOrganizationProfileDto })
  @HttpCode(HttpStatus.CREATED)
  async createSupplierProfile(@Body() dto: CreateOrganizationProfileDto) {
    const result = await this.profileService.createOrganizationProfile(
      'supplier',
      dto,
    );
    return {
      message: 'Supplier profile created successfully',
      data: result,
    };
  }

  @Get('get-my-supplier-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('supplier'))
  @ApiOperation({ summary: 'Get my supplier profile' })
  @ApiOkResponse({ description: 'Supplier profile fetched' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Supplier profile not found' })
  @HttpCode(HttpStatus.OK)
  async getMySupplierProfile(@Req() req: Request) {
    const result = await this.profileService.getMyOrganizationProfile(
      req.user!.id,
      'supplier',
    );
    return {
      message: 'Supplier profile fetched successfully',
      data: result,
    };
  }

  @Patch('update-my-supplier-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('supplier'))
  @ApiOperation({ summary: 'Update my supplier profile' })
  @ApiBody({ type: UpdateOrganizationProfileDto })
  @ApiOkResponse({ description: 'Supplier profile updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Supplier profile not found' })
  @HttpCode(HttpStatus.OK)
  async updateMySupplierProfile(
    @Req() req: Request,
    @Body() dto: UpdateOrganizationProfileDto,
  ) {
    const result = await this.profileService.updateMyOrganizationProfile(
      req.user!.id,
      'supplier',
      dto,
    );
    return {
      message: 'Supplier profile updated successfully',
      data: result,
    };
  }

  @Post('create-service-provider-profile')
  @ApiOperation({ summary: 'Create service provider profile' })
  @ApiBody({ type: CreateOrganizationProfileDto })
  @HttpCode(HttpStatus.CREATED)
  async createServiceProviderProfile(
    @Body() dto: CreateOrganizationProfileDto,
  ) {
    const result = await this.profileService.createOrganizationProfile(
      'service_provider',
      dto,
    );
    return {
      message: 'Service provider profile created successfully',
      data: result,
    };
  }

  @Get('get-my-service-provider-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('service_provider'))
  @ApiOperation({ summary: 'Get my service provider profile' })
  @ApiOkResponse({ description: 'Service provider profile fetched' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Service provider profile not found' })
  @HttpCode(HttpStatus.OK)
  async getMyServiceProviderProfile(@Req() req: Request) {
    const result = await this.profileService.getMyOrganizationProfile(
      req.user!.id,
      'service_provider',
    );
    return {
      message: 'Service provider profile fetched successfully',
      data: result,
    };
  }

  @Patch('update-my-service-provider-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('service_provider'))
  @ApiOperation({ summary: 'Update my service provider profile' })
  @ApiBody({ type: UpdateOrganizationProfileDto })
  @ApiOkResponse({ description: 'Service provider profile updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Service provider profile not found' })
  @HttpCode(HttpStatus.OK)
  async updateMyServiceProviderProfile(
    @Req() req: Request,
    @Body() dto: UpdateOrganizationProfileDto,
  ) {
    const result = await this.profileService.updateMyOrganizationProfile(
      req.user!.id,
      'service_provider',
      dto,
    );
    return {
      message: 'Service provider profile updated successfully',
      data: result,
    };
  }

  @Get('admin/get-profiles')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Admin get profiles' })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Profiles fetched successfully' })
  @HttpCode(HttpStatus.OK)
  async getAdminProfiles(@Req() req: Request) {
    const filters = pick(req.query, ['role', 'status', 'search']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.profileService.getAdminProfiles(filters, options);
    return {
      message: 'Profiles fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('admin/get-profile/:userId')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Admin get profile detail' })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({ description: 'Profile fetched successfully' })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  @HttpCode(HttpStatus.OK)
  async getAdminProfile(@Param('userId') userId: string) {
    const result = await this.profileService.getAdminProfile(userId);
    return {
      message: 'Profile fetched successfully',
      data: result,
    };
  }

  @Post('admin/approve-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Approve profile' })
  @ApiBody({ type: AdminProfileActionDto })
  @HttpCode(HttpStatus.OK)
  async approveProfile(
    @Req() req: Request,
    @Body() dto: AdminProfileActionDto,
  ) {
    const result = await this.profileService.updateProfileStatus(
      'approve-profile',
      req.user!.id,
      dto,
    );
    return { message: 'Profile approved successfully', data: result };
  }

  @Post('admin/reject-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Reject profile' })
  @ApiBody({ type: AdminProfileActionDto })
  @HttpCode(HttpStatus.OK)
  async rejectProfile(@Req() req: Request, @Body() dto: AdminProfileActionDto) {
    const result = await this.profileService.updateProfileStatus(
      'reject-profile',
      req.user!.id,
      dto,
    );
    return { message: 'Profile rejected successfully', data: result };
  }

  @Post('admin/suspend-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Suspend profile' })
  @ApiBody({ type: AdminProfileActionDto })
  @HttpCode(HttpStatus.OK)
  async suspendProfile(
    @Req() req: Request,
    @Body() dto: AdminProfileActionDto,
  ) {
    const result = await this.profileService.updateProfileStatus(
      'suspend-profile',
      req.user!.id,
      dto,
    );
    return { message: 'Profile suspended successfully', data: result };
  }

  @Post('admin/reactivate-profile')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Reactivate profile' })
  @ApiBody({ type: AdminProfileActionDto })
  @HttpCode(HttpStatus.OK)
  async reactivateProfile(
    @Req() req: Request,
    @Body() dto: AdminProfileActionDto,
  ) {
    const result = await this.profileService.updateProfileStatus(
      'reactivate-profile',
      req.user!.id,
      dto,
    );
    return { message: 'Profile reactivated successfully', data: result };
  }
}
