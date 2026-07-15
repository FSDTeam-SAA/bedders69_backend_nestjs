import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MembershipPlan,
  MembershipPlanSchema,
} from './entities/membership-plan.entity';
import { MembershipPlanController } from './membership-plan.controller';
import { MembershipPlanService } from './membership-plan.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MembershipPlan.name, schema: MembershipPlanSchema },
    ]),
  ],
  controllers: [MembershipPlanController],
  providers: [MembershipPlanService],
})
export class MembershipPlanModule {}
