import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CareSkill, CareSkillSchema } from './entities/care-skill.entity';
import { CareSkillController } from './care-skill.controller';
import { CareSkillService } from './care-skill.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CareSkill.name, schema: CareSkillSchema },
    ]),
  ],
  controllers: [CareSkillController],
  providers: [CareSkillService],
  exports: [CareSkillService],
})
export class CareSkillModule {}
