import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscribe,
  SubscribeSchema,
} from '../subscribe/entities/subscribe.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Payment, PaymentSchema } from './entities/payment.entity';
import { Package, PackageSchema } from '../package/entities/package.entity';
import {
  MembershipPlan,
  MembershipPlanSchema,
} from '../membership-plan/entities/membership-plan.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscribe.name, schema: SubscribeSchema },
      { name: User.name, schema: UserSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Package.name, schema: PackageSchema },
      { name: MembershipPlan.name, schema: MembershipPlanSchema },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
