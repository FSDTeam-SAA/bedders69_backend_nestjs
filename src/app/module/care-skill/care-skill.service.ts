import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CareSkill, CareSkillDocument } from './entities/care-skill.entity';
import { CreateCareSkillDto } from './dto/create-care-skill.dto';
import { UpdateCareSkillDto } from './dto/update-care-skill.dto';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';

const DEFAULT_CARE_SKILLS = [
  "Personal Care",
  "Medication Administration",
  "Companionship",
  "Moving & Handling",
  "Live-in Care",
  "First Aid",
  "Catheter Care",
  "PEG Feeding",
  "Hoist Handling",
  "Record Keeping",
  "Dementia Care",
  "End of Life Care",
];

@Injectable()
export class CareSkillService implements OnModuleInit {
  constructor(
    @InjectModel(CareSkill.name)
    private readonly careSkillModel: Model<CareSkillDocument>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.careSkillModel.countDocuments();
      if (count === 0) {
        const initialDocs = DEFAULT_CARE_SKILLS.map((name) => ({ name, isActive: true }));
        await this.careSkillModel.insertMany(initialDocs);
      }
    } catch (e) {
      // Ignore seed error
    }
  }

  async createCareSkill(dto: CreateCareSkillDto): Promise<CareSkill> {
    const existing = await this.careSkillModel.findOne({ name: new RegExp(`^${dto.name.trim()}$`, 'i') });
    if (existing) {
      throw new ConflictException('Care skill with this name already exists');
    }

    const created = new this.careSkillModel(dto);
    return created.save();
  }

  async getAllCareSkills(options: IOptions, search?: string) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions: Record<string, unknown> = {};

    if (search) {
      whereConditions.name = { $regex: search, $options: 'i' };
    }

    const [total, skills] = await Promise.all([
      this.careSkillModel.countDocuments(whereConditions),
      this.careSkillModel
        .find(whereConditions)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .exec(),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: skills,
    };
  }

  async getSingleCareSkill(id: string): Promise<CareSkill> {
    const skill = await this.careSkillModel.findById(id).exec();
    if (!skill) {
      throw new NotFoundException('Care skill not found');
    }
    return skill;
  }

  async updateCareSkill(id: string, dto: UpdateCareSkillDto): Promise<CareSkill> {
    if (dto.name) {
      const existing = await this.careSkillModel.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${dto.name.trim()}$`, 'i'),
      });
      if (existing) {
        throw new ConflictException('Care skill with this name already exists');
      }
    }

    const updated = await this.careSkillModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Care skill not found');
    }

    return updated;
  }

  async deleteCareSkill(id: string): Promise<CareSkill> {
    const deleted = await this.careSkillModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Care skill not found');
    }
    return deleted;
  }
}
