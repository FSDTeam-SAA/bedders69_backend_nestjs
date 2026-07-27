import {
  Controller,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import AuthGuard from 'src/app/middlewares/auth.guard';
import pick from 'src/app/helpers/pick';
import type { Request } from 'express';
import { CreateDashboardCouponDto } from './dto/create-coupon.dto';
import { CouponValidity } from './entities/coupon.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get dashboard overview data',
    description:
      'Returns total users, total completed-payment revenues, active jobs, and pending company approvals.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard overview retrieved successfully',
    schema: {
      example: {
        message: 'Dashboard overview retrieved successfully',
        data: {
          totalUsers: 120,
          revenues: 2450.5,
          activeJobs: 0,
          pendingApprovals: 6,
        },
      },
    },
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async dashboardOverview() {
    const result = await this.dashboardService.dashboardOverView();

    return {
      message: 'Dashboard overview retrieved successfully',
      data: result,
    };
  }

  @Get('chart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get monthly revenue chart',
    description:
      'Returns accurate monthly revenues from completed payments for the selected year.',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Total earning chart fetched successfully',
    schema: {
      example: {
        message: 'Total earning chart fetched successfully',
        data: {
          year: 2026,
          summary: {
            totalRevenue: 2450.5,
          },
          chartData: [
            { month: 'Jan', totalRevenue: 200 },
            { month: 'Feb', totalRevenue: 350.5 },
          ],
        },
      },
    },
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  async getTotalEarningChart(@Query('year') year?: string) {
    const data = await this.dashboardService.getTotalEarningChart(
      year ? Number(year) : undefined,
    );
    return { message: 'Total earning chart fetched successfully', data };
  }

  @Get('users')
  @ApiOperation({
    summary: 'Get dashboard users',
    description:
      'Returns name, role, joining date, location, and status with pagination and filtering by location, role, and status.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({
    name: 'location',
    required: false,
    type: String,
    example: 'London',
    description: 'Filter by country, city, or address',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: [
      'admin',
      'care_company',
      'agency',
      'carer',
      'supplier',
      'service_provider',
      'family',
    ],
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'suspended'],
    description: 'Filter by user status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number. Default is 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page. Default is 10',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
    description: 'Sort field. Default is createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort order. Default is desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users fetched successfully',
    schema: {
      example: {
        message: 'Users fetched successfully',
        meta: {
          page: 1,
          limit: 10,
          total: 1,
        },
        data: [
          {
            id: '65f1c9f234df3c9342a58f00',
            name: 'Saurav Sarkar',
            role: 'family',
            joiningDate: '2026-01-12T10:00:00.000Z',
            location: 'London, United Kingdom',
            address: '10 Downing Street',
            status: 'active',
          },
        ],
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getAllUsers(@Req() req: Request) {
    const filters = pick(req.query, ['location', 'role', 'status']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.dashboardService.getAllUsers(filters, options);

    return {
      message: 'Users fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('approvals')
  @ApiOperation({
    summary: 'Get pending approvals',
    description:
      'Returns pending company approvals with name, role, email, and location using pagination.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number. Default is 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page. Default is 10',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
    description: 'Sort field. Default is createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort order. Default is desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Approvals fetched successfully',
    schema: {
      example: {
        message: 'Approvals fetched successfully',
        meta: {
          page: 1,
          limit: 10,
          total: 1,
        },
        data: [
          {
            id: '65f1c9f234df3c9342a58f00',
            name: 'Bedders Care Ltd',
            role: 'care_company',
            email: 'care@example.com',
            location: '221B Baker Street, London',
            coordinates: [-0.1586, 51.5237],
          },
        ],
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getPendingApprovals(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.dashboardService.getPendingApprovals(options);

    return {
      message: 'Approvals fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('jobs')
  @ApiOperation({
    summary: 'Get dashboard job listings',
    description:
      'Returns name, employment time, title, location, and experience level with pagination. Filters: employmentType, experienceLevel, title only.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({
    name: 'employmentType',
    required: false,
    type: String,
    example: 'full_time',
    description: 'Filter by employment type only',
  })
  @ApiQuery({
    name: 'experienceLevel',
    required: false,
    type: String,
    example: 'mid',
    description: 'Filter by experience level only',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    type: String,
    example: 'Care Assistant',
    description: 'Filter by title only',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number. Default is 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page. Default is 10',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
    description: 'Sort field. Default is createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort order. Default is desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job listings fetched successfully',
    schema: {
      example: {
        message: 'Job listings fetched successfully',
        meta: { page: 1, limit: 10, total: 1 },
        data: [
          {
            id: '65f1c9f234df3c9342a58f00',
            name: 'Bedders Care Ltd',
            employmentTime: 'full_time',
            title: 'Care Assistant',
            location: 'London',
            experienceLevel: 'mid',
          },
        ],
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getJobListings(@Req() req: Request) {
    const filters = pick(req.query, [
      'employmentType',
      'experienceLevel',
      'title',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.dashboardService.getJobListings(filters, options);

    return {
      message: 'Job listings fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('marketplace')
  @ApiOperation({
    summary: 'Get marketplace management list',
    description:
      'Returns name, category, price, and expiry date with pagination. Filter: category only.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    example: 'equipment',
    description: 'Filter by category only',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number. Default is 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page. Default is 10',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
    description: 'Sort field. Default is createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort order. Default is desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Marketplace items fetched successfully',
    schema: {
      example: {
        message: 'Marketplace items fetched successfully',
        meta: { page: 1, limit: 10, total: 1 },
        data: [
          {
            id: '65f1c9f234df3c9342a58f00',
            name: 'Care Bed',
            category: 'equipment',
            price: 120,
            expiryDate: '2026-12-31T00:00:00.000Z',
          },
        ],
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getMarketplaceManagement(@Req() req: Request) {
    const filters = pick(req.query, ['category']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.dashboardService.getMarketplaceManagement(
      filters,
      options,
    );

    return {
      message: 'Marketplace items fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('revenues')
  @ApiOperation({
    summary: 'Get revenue management list',
    description:
      'Returns name, plan, amount, status, and expiry date with pagination. Filters: month and year only.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    example: 7,
    description: 'Filter by payment month only. Use 1-12.',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    example: 2026,
    description: 'Filter by payment year only',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number. Default is 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page. Default is 10',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
    description: 'Sort field. Default is createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort order. Default is desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenues fetched successfully',
    schema: {
      example: {
        message: 'Revenues fetched successfully',
        meta: { page: 1, limit: 10, total: 1 },
        data: [
          {
            id: '65f1c9f234df3c9342a58f00',
            name: 'Saurav Sarkar',
            plan: 'Premium',
            amount: 99,
            status: 'completed',
            expiryDate: '2026-08-19T00:00:00.000Z',
          },
        ],
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getRevenueManagement(@Req() req: Request) {
    const filters = pick(req.query, ['month', 'year']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.dashboardService.getRevenueManagement(
      filters,
      options,
    );

    return {
      message: 'Revenues fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post('coupons')
  @ApiOperation({
    summary: 'Create dashboard coupon',
    description:
      'Creates a coupon with name, code, description, discount value, usage limit, dates, and validity settings.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiBody({ type: CreateDashboardCouponDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Coupon created successfully',
    schema: {
      example: {
        message: 'Coupon created successfully',
        data: {
          id: '65f1c9f234df3c9342a58f00',
          couponName: 'Summer Discount',
          couponCode: 'SUMMER20',
          description: '20 off for summer campaign',
          discountValue: 20,
          totalUsageLimit: 100,
          usedCount: 0,
          startDate: '2026-07-01T00:00:00.000Z',
          expiryDate: '2026-12-31T23:59:59.000Z',
          validitySettings: CouponValidity.ALL_USERS,
        },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createCoupon(@Body() createCouponDto: CreateDashboardCouponDto) {
    const result = await this.dashboardService.createCoupon(createCouponDto);

    return {
      message: 'Coupon created successfully',
      data: result,
    };
  }

  @Get('coupons')
  @ApiOperation({
    summary: 'Get dashboard coupons',
    description:
      'Returns coupon code, value, eligible users, usage, expiry date, and status with pagination.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number. Default is 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page. Default is 10',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
    description: 'Sort field. Default is createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort order. Default is desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupons fetched successfully',
    schema: {
      example: {
        message: 'Coupons fetched successfully',
        meta: { page: 1, limit: 10, total: 1 },
        data: [
          {
            id: '65f1c9f234df3c9342a58f00',
            couponCode: 'SUMMER20',
            value: 20,
            eligibleUsers: CouponValidity.ALL_USERS,
            usage: '12/100',
            usedCount: 12,
            totalUsageLimit: 100,
            expiryDate: '2026-12-31T23:59:59.000Z',
            status: 'active',
          },
        ],
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getAllCoupons(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.dashboardService.getAllCoupons(options);

    return {
      message: 'Coupons fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('mvp-reports')
  @ApiOperation({
    summary: 'Get MVP admin reports',
    description:
      'Returns consolidated MVP metrics for users, approvals, revenue, jobs, marketplace, advertisements, and notifications.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MVP admin reports fetched successfully',
    schema: {
      example: {
        message: 'MVP admin reports fetched successfully',
        data: {
          users: {
            total: 120,
            byRole: { carer: 60, care_company: 12 },
            byStatus: { active: 80, pending: 30 },
          },
          approvals: {
            familyProfiles: 20,
            carerProfiles: 60,
            careCompanies: { approved: 8, pending: 4 },
            organizations: [
              { profileType: 'supplier', status: 'approved', total: 5 },
            ],
          },
          revenue: {
            totalRevenue: 2450.5,
            completedPayments: 25,
            paymentsByStatus: { completed: 25, pending: 4 },
          },
          jobs: { byStatus: { approved: 10 }, applications: 22 },
          marketplace: {
            listingsByStatus: { approved: 12 },
            inquiries: 8,
          },
          advertisements: {
            byStatus: { approved: 3 },
            totalImpressions: 1200,
            totalClicks: 72,
            clickThroughRate: 6,
          },
          notifications: { byStatus: { sent: 18, failed: 2 } },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getMvpReports() {
    const result = await this.dashboardService.getMvpReports();

    return {
      message: 'MVP admin reports fetched successfully',
      data: result,
    };
  }
}
