import { HttpException, Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../payment/entities/payment.entity';
import { Company, CompanyDocument } from '../company/entities/company.entity';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import { JobListing, JobListingDocument } from './entities/job-listing.entity';
import {
  Marketplace,
  MarketplaceDocument,
} from './entities/marketplace.entity';
import { Coupon, CouponDocument } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(JobListing.name)
    private readonly jobListingModel: Model<JobListingDocument>,
    @InjectModel(Marketplace.name)
    private readonly marketplaceModel: Model<MarketplaceDocument>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
  ) {}

  private getCouponStatus(coupon: any) {
    const now = new Date();
    const startDate = coupon.startDate ? new Date(coupon.startDate) : undefined;
    const expiryDate = coupon.expiryDate
      ? new Date(coupon.expiryDate)
      : undefined;

    if (startDate && startDate > now) return 'upcoming';
    if (expiryDate && expiryDate < now) return 'expired';
    if (Number(coupon.usedCount || 0) >= Number(coupon.totalUsageLimit || 0)) {
      return 'usage_limit_reached';
    }

    return 'active';
  }

  async createCoupon(createCouponDto: CreateCouponDto) {
    const couponCode = createCouponDto.couponCode.trim().toUpperCase();
    const existingCoupon = await this.couponModel.findOne({ couponCode });

    if (existingCoupon) {
      throw new HttpException('Coupon code already exists', 400);
    }

    const result = await this.couponModel.create({
      ...createCouponDto,
      couponCode,
    });

    return result;
  }

  async dashboardOverView() {
    const [totalUsers, activeJobs, pendingApprovals, revenueResult] =
      await Promise.all([
        this.userModel.countDocuments(),
        this.jobListingModel.countDocuments({ status: 'active' }),
        this.companyModel.countDocuments({ status: 'pending' }),
        this.paymentModel.aggregate([
          {
            $match: {
              status: 'completed',
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $convert: {
                    input: '$amount',
                    to: 'double',
                    onError: 0,
                    onNull: 0,
                  },
                },
              },
            },
          },
        ]),
      ]);

    const revenueTotal = Number(
      (revenueResult[0] as { total?: number } | undefined)?.total ?? 0,
    );

    return {
      totalUsers,
      revenues: Number(revenueTotal.toFixed(2)),
      activeJobs,
      pendingApprovals,
    };
  }

  async getTotalEarningChart(year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    const startDate = new Date(Date.UTC(targetYear, 0, 1));
    const endDate = new Date(Date.UTC(targetYear + 1, 0, 1));

    const result = await this.paymentModel.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%m',
              date: '$createdAt',
              timezone: 'UTC',
            },
          },
          totalRevenue: {
            $sum: {
              $convert: {
                input: '$amount',
                to: 'double',
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const chartData = months.map((label, i) => {
      const month = String(i + 1).padStart(2, '0');
      const found = result.find((r) => r._id === month);
      const totalRevenue = found
        ? Number(Number(found.totalRevenue).toFixed(2))
        : 0;
      return { month: label, totalRevenue };
    });

    const totalYearRevenue = chartData.reduce((s, d) => s + d.totalRevenue, 0);

    return {
      year: targetYear,
      summary: {
        totalRevenue: Number(totalYearRevenue.toFixed(2)),
      },
      chartData,
    };
  }

  async getAllUsers(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { location, role, status } = params;
    const whereConditions: Record<string, unknown> = {};

    if (role) whereConditions.role = role;
    if (status) whereConditions.status = status;
    if (location) {
      whereConditions.$or = ['country', 'city', 'address'].map((field) => ({
        [field]: { $regex: location, $options: 'i' },
      }));
    }

    const [total, users] = await Promise.all([
      this.userModel.countDocuments(whereConditions),
      this.userModel
        .find(whereConditions)
        .select('fullName role createdAt country city address status')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: users.map((user: any) => ({
        id: user._id,
        name: user.fullName || '',
        role: user.role,
        joiningDate: user.createdAt,
        location: [user.city, user.country].filter(Boolean).join(', '),
        address: user.address || '',
        status: user.status,
      })),
    };
  }

  async getPendingApprovals(options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = { status: 'pending' };

    const [total, approvals] = await Promise.all([
      this.companyModel.countDocuments(whereConditions),
      this.companyModel
        .find(whereConditions)
        .populate('userId', 'fullName role email')
        .select('companyName email address location userId')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: approvals.map((approval: any) => {
        const user = approval.userId || {};

        return {
          id: approval._id,
          name: approval.companyName || user.fullName || '',
          role: user.role || 'care_company',
          email: approval.email || user.email || '',
          location: approval.address || '',
          coordinates: approval.location?.coordinates,
        };
      }),
    };
  }

  async getJobListings(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { employmentType, experienceLevel, title } = params;
    const whereConditions: Record<string, unknown> = {};

    if (employmentType) {
      whereConditions.employmentType = employmentType;
    }
    if (experienceLevel) {
      whereConditions.experienceLevel = experienceLevel;
    }
    if (title) {
      whereConditions.title = { $regex: title, $options: 'i' };
    }

    const [total, jobs] = await Promise.all([
      this.jobListingModel.countDocuments(whereConditions),
      this.jobListingModel
        .find(whereConditions)
        .select(
          'name employmentType employmentTime title location experienceLevel',
        )
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: jobs.map((job: any) => ({
        id: job._id,
        name: job.name || '',
        employmentTime: job.employmentTime || job.employmentType || '',
        title: job.title || '',
        location: job.location || '',
        experienceLevel: job.experienceLevel || '',
      })),
    };
  }

  async getMarketplaceManagement(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { category } = params;
    const whereConditions: Record<string, unknown> = {};

    if (category) {
      whereConditions.category = category;
    }

    const [total, items] = await Promise.all([
      this.marketplaceModel.countDocuments(whereConditions),
      this.marketplaceModel
        .find(whereConditions)
        .select('name category price expiryDate')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: items.map((item: any) => ({
        id: item._id,
        name: item.name || '',
        category: item.category || '',
        price: Number(item.price || 0),
        expiryDate: item.expiryDate,
      })),
    };
  }

  async getRevenueManagement(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { month, year } = params;
    const whereConditions: Record<string, unknown> = {};

    if (month || year) {
      const selectedYear = Number(year) || new Date().getFullYear();
      const selectedMonth = Number(month);

      if (selectedMonth >= 1 && selectedMonth <= 12) {
        whereConditions.createdAt = {
          $gte: new Date(Date.UTC(selectedYear, selectedMonth - 1, 1)),
          $lt: new Date(Date.UTC(selectedYear, selectedMonth, 1)),
        };
      } else {
        whereConditions.createdAt = {
          $gte: new Date(Date.UTC(selectedYear, 0, 1)),
          $lt: new Date(Date.UTC(selectedYear + 1, 0, 1)),
        };
      }
    }

    const [total, revenues] = await Promise.all([
      this.paymentModel.countDocuments(whereConditions),
      this.paymentModel
        .find(whereConditions)
        .populate('user', 'fullName email')
        .populate('subscribe', 'planName')
        .select('user subscribe amount status expiryDate createdAt')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: revenues.map((revenue: any) => {
        const user = revenue.user || {};
        const plan = revenue.subscribe || {};
        const createdAt = revenue.createdAt
          ? new Date(revenue.createdAt)
          : undefined;
        const fallbackExpiryDate = createdAt
          ? new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
          : undefined;

        return {
          id: revenue._id,
          name: user.fullName || user.email || '',
          plan: plan.planName || '',
          amount: Number(revenue.amount || 0),
          status: revenue.status,
          expiryDate: revenue.expiryDate || fallbackExpiryDate,
        };
      }),
    };
  }

  async getAllCoupons(options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const [total, coupons] = await Promise.all([
      this.couponModel.countDocuments(),
      this.couponModel
        .find()
        .select(
          'couponCode discountValue validitySettings usedCount totalUsageLimit expiryDate startDate',
        )
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: coupons.map((coupon: any) => ({
        id: coupon._id,
        couponCode: coupon.couponCode,
        value: Number(coupon.discountValue || 0),
        eligibleUsers: coupon.validitySettings,
        usage: `${Number(coupon.usedCount || 0)}/${Number(
          coupon.totalUsageLimit || 0,
        )}`,
        usedCount: Number(coupon.usedCount || 0),
        totalUsageLimit: Number(coupon.totalUsageLimit || 0),
        expiryDate: coupon.expiryDate,
        status: this.getCouponStatus(coupon),
      })),
    };
  }
}
