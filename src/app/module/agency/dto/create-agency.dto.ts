import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateAgencyDto {
  @ApiProperty({
    example: 'ABC Care Agency',
    description: 'Agency name',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'REG-123456',
    description: 'Agency registration number',
  })
  @IsString()
  registerNumber!: string;

  @ApiProperty({
    example: 'info@abccare.com',
    description: 'Agency email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'secret123',
    description: 'Agency password',
  })
  @IsString()
  password!: string;

  @ApiProperty({
    example: '+8801712345678',
    description: 'Agency phone number',
  })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({
    example: 'https://abccare.com',
    description: 'Agency website',
  })
  @IsUrl()
  website!: string;

  @ApiProperty({
    example: 'ABC Care Agency provides home care and nursing services.',
    description: 'Agency description',
  })
  @IsString()
  discription!: string;

  @ApiPropertyOptional({
    example: 'support@abccare.com',
    description: 'Alternative email',
  })
  @IsOptional()
  @IsEmail()
  alternatageEmail?: string;

  @ApiProperty({
    example: 'House-12, Road-5, Dhanmondi, Dhaka',
    description: 'Agency address',
  })
  @IsString()
  address!: string;

  @ApiProperty({
    type: [String],
    example: ['Home Care', 'Nursing', 'Elderly Care'],
    description: 'Agency specialisations',
  })
  @IsArray()
  @IsString({ each: true })
  specialisations!: string[];

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://example.com/license.pdf',
      'https://example.com/certificate.pdf',
    ],
    description: 'Agency documents',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];
}
