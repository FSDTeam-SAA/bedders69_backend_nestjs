import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { UtilsInterceptor } from '../src/app/utils/utils.interceptor';
import { AuthController } from '../src/app/module/auth/auth.controller';
import { AuthService } from '../src/app/module/auth/auth.service';
import { ProfileController } from '../src/app/module/profile/profile.controller';
import { ProfileService } from '../src/app/module/profile/profile.service';
import { PackageController } from '../src/app/module/package/package.controller';
import { PackageService } from '../src/app/module/package/package.service';
import { PaymentController } from '../src/app/module/payment/payment.controller';
import { PaymentService } from '../src/app/module/payment/payment.service';
import { JobController } from '../src/app/module/job/job.controller';
import { JobService } from '../src/app/module/job/job.service';
import { JobApplicationController } from '../src/app/module/job-application/job-application.controller';
import { JobApplicationService } from '../src/app/module/job-application/job-application.service';
import { MarketplaceController } from '../src/app/module/marketplace/marketplace.controller';
import { MarketplaceService } from '../src/app/module/marketplace/marketplace.service';
import { AdvertisementController } from '../src/app/module/advertisement/advertisement.controller';
import { AdvertisementService } from '../src/app/module/advertisement/advertisement.service';
import { EntitlementController } from '../src/app/module/entitlement/entitlement.controller';
import { EntitlementService } from '../src/app/module/entitlement/entitlement.service';
import { JwtService } from '@nestjs/jwt';

const paged = (data: unknown[] = []) => ({
  meta: { page: 1, limit: 10, total: data.length },
  data,
});

describe('MVP HTTP contract (e2e)', () => {
  let app: INestApplication<App>;

  const authService = {
    register: jest.fn().mockResolvedValue({
      _id: 'user-id',
      email: 'family@example.com',
      role: 'family',
      status: 'active',
    }),
    login: jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      user: { _id: 'user-id', email: 'family@example.com', role: 'family' },
    }),
    refreshToken: jest.fn().mockResolvedValue({
      accessToken: 'next-access-token',
      user: { _id: 'user-id', email: 'family@example.com', role: 'family' },
    }),
    logout: jest.fn().mockReturnValue({ message: 'Logged out successfully' }),
  };

  const profileService = {
    searchCareCompanies: jest.fn().mockResolvedValue(paged()),
    searchOrganizationDirectory: jest.fn().mockResolvedValue(paged()),
    searchRestrictedCarers: jest.fn().mockResolvedValue(paged()),
    createOrganizationProfile: jest.fn().mockResolvedValue({ _id: 'profile-id' }),
  };

  const packageService = {
    getPackages: jest.fn().mockResolvedValue(paged()),
    getPackage: jest.fn().mockResolvedValue({ _id: 'package-id' }),
  };

  const paymentService = {
    createPackageCheckout: jest.fn(),
  };

  const entitlementService = {
    getMyEntitlements: jest.fn(),
  };

  const jobService = {
    searchJobs: jest.fn().mockResolvedValue(paged()),
    getJob: jest.fn().mockResolvedValue({ _id: 'job-id' }),
  };

  const jobApplicationService = {
    applyToJob: jest.fn(),
  };

  const marketplaceService = {
    searchMarketplaceListings: jest.fn().mockResolvedValue(paged()),
    getMarketplaceListing: jest.fn().mockResolvedValue({ _id: 'listing-id' }),
    createMarketplaceInquiry: jest.fn().mockResolvedValue({ _id: 'inquiry-id' }),
  };

  const advertisementService = {
    serveAdvertisements: jest.fn().mockResolvedValue(paged()),
    trackAdvertisementImpression: jest.fn().mockResolvedValue({
      _id: 'advertisement-id',
      impressions: 1,
    }),
    trackAdvertisementClick: jest.fn().mockResolvedValue({
      _id: 'advertisement-id',
      clicks: 1,
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        AuthController,
        ProfileController,
        PackageController,
        PaymentController,
        EntitlementController,
        JobController,
        JobApplicationController,
        MarketplaceController,
        AdvertisementController,
      ],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ProfileService, useValue: profileService },
        { provide: PackageService, useValue: packageService },
        { provide: PaymentService, useValue: paymentService },
        { provide: EntitlementService, useValue: entitlementService },
        { provide: JobService, useValue: jobService },
        { provide: JobApplicationService, useValue: jobApplicationService },
        { provide: MarketplaceService, useValue: marketplaceService },
        { provide: AdvertisementService, useValue: advertisementService },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new UtilsInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates auth registration input and supports refresh/logout endpoints', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', ['refreshToken=refresh-token'])
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.accessToken).toBe('next-access-token');
      });

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.message).toBe('Logged out successfully');
      });
  });

  it('serves public directories, jobs, marketplace listings, ads, and packages', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/profiles/search-care-companies?city=London')
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/profiles/search-recruitment-agencies?city=London')
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/packages/get-packages?type=membership')
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/jobs/search-jobs?search=carer')
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/marketplace/search-marketplace-listings?category=equipment')
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/advertisements/serve-advertisements?placement=directory_top')
      .expect(200);
  });

  it('keeps restricted MVP workflows protected without a bearer token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/profiles/search-restricted-carers')
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/profiles/admin/approve-profile')
      .send({ userId: '65f1c9f234df3c9342a58f00' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/payment/create-package-checkout/package-id')
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/entitlements/get-my-entitlements')
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/job-applications/apply-to-job/job-id')
      .send({ coverLetter: 'I am interested in this role.' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/marketplace/create-marketplace-listing')
      .send({ title: 'Care bed', category: 'equipment' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/advertisements/create-advertisement')
      .send({
        title: 'Directory banner',
        placement: 'directory_top',
        startsAt: '2026-08-01T00:00:00.000Z',
        endsAt: '2026-08-31T23:59:59.000Z',
      })
      .expect(401);
  });

  it('accepts public marketplace inquiries and advertisement tracking', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/marketplace/create-marketplace-inquiry/listing-id')
      .send({
        name: 'Nadia Sarkar',
        email: 'nadia@example.com',
        message: 'Is this still available?',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.data._id).toBe('inquiry-id');
      });

    await request(app.getHttpServer())
      .post('/api/v1/advertisements/track-advertisement-impression/ad-id')
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/advertisements/track-advertisement-click/ad-id')
      .expect(200);
  });
});
