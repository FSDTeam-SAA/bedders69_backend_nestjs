import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { Payment, PaymentSchema } from '../payment/entities/payment.entity';
import {
  Subscribe,
  SubscribeSchema,
} from '../subscribe/entities/subscribe.entity';
import { Package, PackageSchema } from '../package/entities/package.entity';
import {
  Entitlement,
  EntitlementSchema,
} from '../entitlement/entities/entitlement.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Subscribe.name, schema: SubscribeSchema },
      { name: Package.name, schema: PackageSchema },
      { name: Entitlement.name, schema: EntitlementSchema },
    ]),
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
