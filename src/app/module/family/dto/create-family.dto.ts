import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class LocationDto {
  @ApiProperty({ example: 23.8103 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 90.4125 })
  @IsNumber()
  longitude!: number;
}

export class CreateFamilyDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  password!: string;

  @ApiProperty({ example: '+8801700000000' })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({ example: '1207' })
  @IsString()
  postCode!: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  city!: string;

  @ApiProperty({ example: 'Road 12, Banani' })
  @IsString()
  street!: string;

  @ApiPropertyOptional({ type: () => LocationDto })
  @IsOptional()
  @Transform(({ value }) => {
    try {
      const location = typeof value === 'string' ? JSON.parse(value) : value;
      return Object.assign(new LocationDto(), location);
    } catch {
      return value;
    }
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({
    type: [String],
    example: ['Elderly care', 'Medication reminder'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  careNeeds?: string[];

  @ApiPropertyOptional({ type: String, format: 'binary' })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}
