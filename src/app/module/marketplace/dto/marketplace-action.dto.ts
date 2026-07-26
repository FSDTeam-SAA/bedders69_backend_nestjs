import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class AdminMarketplaceListingActionDto {
  @ApiProperty({ example: '65f1c9f234df3c9342a58f00' })
  @IsMongoId()
  listingId!: string;

  @ApiPropertyOptional({ example: 'Listing details are clear and compliant.' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateMarketplaceInquiryDto {
  @ApiProperty({ example: 'Nadia Sarkar' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'nadia@example.com' })
  @IsString()
  email!: string;

  @ApiPropertyOptional({ example: '+44 7700 900123' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Is this still available for collection next week?' })
  @IsString()
  message!: string;
}
