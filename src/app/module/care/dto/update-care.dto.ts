import { PartialType } from '@nestjs/swagger';
import { CreateCareDto } from './create-care.dto';

export class UpdateCareDto extends PartialType(CreateCareDto) {}
