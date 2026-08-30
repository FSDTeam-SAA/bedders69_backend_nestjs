import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import {
  CreateCareDto,
  ExperienceDto,
  LocationDto,
} from './create-care.dto';

const parseOptionalJson = (value: unknown): unknown => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

export class UpdateCareDto extends PartialType(CreateCareDto) {
  @IsOptional()
  @Transform(({ value }) => parseOptionalJson(value))
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @Transform(({ value }) => parseOptionalJson(value))
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience?: ExperienceDto[];
}
