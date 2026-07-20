import { PartialType } from '@nestjs/swagger';
import { CreateOrganizationProfileDto } from './create-organization-profile.dto';

export class UpdateOrganizationProfileDto extends PartialType(
  CreateOrganizationProfileDto,
) {}
