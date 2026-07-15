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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
