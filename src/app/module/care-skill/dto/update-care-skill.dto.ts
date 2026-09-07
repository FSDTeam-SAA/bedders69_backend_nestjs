import { PartialType } from '@nestjs/swagger';
import { CreateCareSkillDto } from './create-care-skill.dto';

export class UpdateCareSkillDto extends PartialType(CreateCareSkillDto) {}
