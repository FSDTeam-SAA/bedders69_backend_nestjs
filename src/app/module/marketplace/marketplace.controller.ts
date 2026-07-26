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
import AuthGuard from 'src/app/middlewares/auth.guard';
import { CreateMarketplaceListingDto } from './dto/create-marketplace-listing.dto';
import {
  AdminMarketplaceListingActionDto,
  CreateMarketplaceInquiryDto,
} from './dto/marketplace-action.dto';
import { UpdateMarketplaceListingDto } from './dto/update-marketplace-listing.dto';
import { MarketplaceService } from './marketplace.service';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('create-marketplace-listing')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('supplier', 'service_provider'))
  @ApiOperation({ summary: 'Create a marketplace listing' })
  @ApiBody({ type: CreateMarketplaceListingDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async createMarketplaceListing(
    @Req() req: Request,
    @Body() dto: CreateMarketplaceListingDto,
  ) {
    const result = await this.marketplaceService.createMarketplaceListing(
      req.user!.id,
      dto,
    );
    return {
      message: 'Marketplace listing created successfully',
      data: result,
    };
  }

  @Patch('update-marketplace-listing/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('supplier', 'service_provider'))
  @ApiOperation({ summary: 'Update a marketplace listing' })
  @ApiParam({ name: 'id', type: String, description: 'Marketplace listing ID' })
  @ApiBody({ type: UpdateMarketplaceListingDto })
  @ApiOkResponse({ description: 'Marketplace listing updated successfully' })
  @ApiNotFoundResponse({ description: 'Marketplace listing not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async updateMarketplaceListing(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateMarketplaceListingDto,
  ) {
    const result = await this.marketplaceService.updateMarketplaceListing(
      id,
      req.user!.id,
      dto,
    );
    return {
      message: 'Marketplace listing updated successfully',
      data: result,
    };
  }

  @Delete('delete-marketplace-listing/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('supplier', 'service_provider'))
  @ApiOperation({ summary: 'Delete a marketplace listing' })
  @ApiParam({ name: 'id', type: String, description: 'Marketplace listing ID' })
  @ApiOkResponse({ description: 'Marketplace listing deleted successfully' })
  @ApiNotFoundResponse({ description: 'Marketplace listing not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async deleteMarketplaceListing(@Param('id') id: string, @Req() req: Request) {
    const result = await this.marketplaceService.deleteMarketplaceListing(
      id,
      req.user!.id,
    );
    return {
      message: 'Marketplace listing deleted successfully',
      data: result,
    };
  }

  @Patch('submit-marketplace-listing/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('supplier', 'service_provider'))
  @ApiOperation({ summary: 'Submit a marketplace listing for admin approval' })
  @ApiParam({ name: 'id', type: String, description: 'Marketplace listing ID' })
  @ApiOkResponse({ description: 'Marketplace listing submitted for approval' })
  @ApiNotFoundResponse({ description: 'Marketplace listing not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async submitMarketplaceListing(@Param('id') id: string, @Req() req: Request) {
    const result = await this.marketplaceService.submitMarketplaceListing(
      id,
      req.user!.id,
    );
    return {
      message: 'Marketplace listing submitted for approval',
      data: result,
    };
  }

  @Get('get-my-marketplace-listings')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('supplier', 'service_provider'))
  @ApiOperation({ summary: 'Get my marketplace listings' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Marketplace listings fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getMyMarketplaceListings(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.marketplaceService.getMyMarketplaceListings(
      req.user!.id,
      options,
    );
    return {
      message: 'Marketplace listings fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('search-marketplace-listings')
  @ApiOperation({ summary: 'Search approved public marketplace listings' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'postCode', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Marketplace listings fetched successfully' })
  @HttpCode(HttpStatus.OK)
  async searchMarketplaceListings(@Req() req: Request) {
    const filters = pick(req.query, [
      'search',
      'category',
      'city',
      'postCode',
      'minPrice',
      'maxPrice',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.marketplaceService.searchMarketplaceListings(
      filters,
      options,
    );
    return {
      message: 'Marketplace listings fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('get-marketplace-listing/:id')
  @ApiOperation({ summary: 'Get a single public marketplace listing' })
  @ApiParam({ name: 'id', type: String, description: 'Marketplace listing ID' })
  @ApiOkResponse({ description: 'Marketplace listing fetched successfully' })
  @ApiNotFoundResponse({ description: 'Marketplace listing not found' })
  @HttpCode(HttpStatus.OK)
  async getMarketplaceListing(@Param('id') id: string) {
    const result = await this.marketplaceService.getMarketplaceListing(id);
    return {
      message: 'Marketplace listing fetched successfully',
      data: result,
    };
  }

  @Post('create-marketplace-inquiry/:listingId')
  @ApiOperation({ summary: 'Create an inquiry for a marketplace listing' })
  @ApiParam({
    name: 'listingId',
    type: String,
    description: 'Marketplace listing ID',
  })
  @ApiBody({ type: CreateMarketplaceInquiryDto })
  @ApiOkResponse({ description: 'Marketplace inquiry created successfully' })
  @ApiNotFoundResponse({ description: 'Marketplace listing not found' })
  @HttpCode(HttpStatus.CREATED)
  async createMarketplaceInquiry(
    @Param('listingId') listingId: string,
    @Req() req: Request,
    @Body() dto: CreateMarketplaceInquiryDto,
  ) {
    const result = await this.marketplaceService.createMarketplaceInquiry(
      listingId,
      dto,
      req.user?.id,
    );
    return {
      message: 'Marketplace inquiry created successfully',
      data: result,
    };
  }

  @Get('admin/get-marketplace-listings')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Admin get marketplace listings' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Marketplace listings fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getAdminMarketplaceListings(@Req() req: Request) {
    const filters = pick(req.query, ['status', 'search', 'category']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.marketplaceService.getAdminMarketplaceListings(
      filters,
      options,
    );
    return {
      message: 'Marketplace listings fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post('admin/approve-marketplace-listing')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Approve a marketplace listing (admin)' })
  @ApiBody({ type: AdminMarketplaceListingActionDto })
  @ApiOkResponse({ description: 'Marketplace listing approved successfully' })
  @ApiNotFoundResponse({ description: 'Marketplace listing not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async approveMarketplaceListing(
    @Req() req: Request,
    @Body() dto: AdminMarketplaceListingActionDto,
  ) {
    const result = await this.marketplaceService.approveMarketplaceListing(
      req.user!.id,
      dto.listingId,
      dto.reason,
    );
    return {
      message: 'Marketplace listing approved successfully',
      data: result,
    };
  }

  @Post('admin/reject-marketplace-listing')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Reject a marketplace listing (admin)' })
  @ApiBody({ type: AdminMarketplaceListingActionDto })
  @ApiOkResponse({ description: 'Marketplace listing rejected successfully' })
  @ApiNotFoundResponse({ description: 'Marketplace listing not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async rejectMarketplaceListing(
    @Req() req: Request,
    @Body() dto: AdminMarketplaceListingActionDto,
  ) {
    const result = await this.marketplaceService.rejectMarketplaceListing(
      req.user!.id,
      dto.listingId,
      dto.reason,
    );
    return {
      message: 'Marketplace listing rejected successfully',
      data: result,
    };
  }
}
