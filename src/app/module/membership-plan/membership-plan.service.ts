import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import {
  MembershipPlan,
  MembershipPlanDocument,
} from './entities/membership-plan.entity';

@Injectable()
export class MembershipPlanService {
  constructor(
    @InjectModel(MembershipPlan.name)
    private readonly membershipPlanModel: Model<MembershipPlanDocument>,
  ) {}

  async create(createMembershipPlanDto: CreateMembershipPlanDto) {
    const existingPlan = await this.membershipPlanModel.findOne({
      title: createMembershipPlanDto.title,
      duration: createMembershipPlanDto.duration,
    });

    if (existingPlan) {
      throw new HttpException('Membership plan already exists', 400);
    }

    if (createMembershipPlanDto.isPopular) {
      await this.membershipPlanModel.updateMany(
        { duration: createMembershipPlanDto.duration },
        { isPopular: false },
      );
    }

    return this.membershipPlanModel.create(createMembershipPlanDto);
  }

  async findAll() {
    return this.membershipPlanModel.find().sort({ createdAt: -1 });
  }

  async update(id: string, updateMembershipPlanDto: UpdateMembershipPlanDto) {
    const existing = await this.membershipPlanModel.findById(id);
    if (!existing) {
      throw new HttpException('Membership plan not found', 404);
    }

    const targetDuration =
      updateMembershipPlanDto.duration || existing.duration;

    if (updateMembershipPlanDto.isPopular) {
      await this.membershipPlanModel.updateMany(
        { duration: targetDuration, _id: { $ne: id } },
        { isPopular: false },
      );
    }

    const result = await this.membershipPlanModel.findByIdAndUpdate(
      id,
      updateMembershipPlanDto,
      { new: true },
    );

    return result;
  }

  async remove(id: string) {
    const result = await this.membershipPlanModel.findByIdAndDelete(id);

    if (!result) {
      throw new HttpException('Membership plan not found', 404);
    }

    return result;
  }
}
