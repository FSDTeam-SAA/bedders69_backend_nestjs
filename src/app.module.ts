import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './app/config';
import { AuthModule } from './app/module/auth/auth.module';
import { ContactModule } from './app/module/contact/contact.module';
import { DashboardModule } from './app/module/dashboard/dashboard.module';
import { PaymentModule } from './app/module/payment/payment.module';
import { SubscribeModule } from './app/module/subscribe/subscribe.module';
import { UserModule } from './app/module/user/user.module';
import { WebhookModule } from './app/module/webhook/webhook.module';
import { FamilyModule } from './app/module/family/family.module';
import { CompanyModule } from './app/module/company/company.module';
import { MembershipPlanModule } from './app/module/membership-plan/membership-plan.module';
import { CouponModule } from './app/module/coupon/coupon.module';
import { ServiceModule } from './app/module/service/service.module';
import { ProductCategoryModule } from './app/module/product-category/product-category.module';
import { ProductModule } from './app/module/product/product.module';
import { CareModule } from './app/module/care/care.module';
import { ProfileModule } from './app/module/profile/profile.module';
<<<<<<< HEAD
import { PackageModule } from './app/module/package/package.module';
import { EntitlementModule } from './app/module/entitlement/entitlement.module';
=======
import { AgencyModule } from './app/module/agency/agency.module';
>>>>>>> 99463d40e1732479f324c110cf35e5e1c6987058

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(config.mongoUri),
    UserModule,
    AuthModule,
    ContactModule,
    DashboardModule,
    SubscribeModule,
    PaymentModule,
    WebhookModule,
    FamilyModule,
    CompanyModule,
    MembershipPlanModule,
    CouponModule,
    ServiceModule,
    ProductCategoryModule,
    ProductModule,
    CareModule,
    ProfileModule,
<<<<<<< HEAD
    PackageModule,
    EntitlementModule,
=======
    AgencyModule,
>>>>>>> 99463d40e1732479f324c110cf35e5e1c6987058
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
