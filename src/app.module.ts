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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
