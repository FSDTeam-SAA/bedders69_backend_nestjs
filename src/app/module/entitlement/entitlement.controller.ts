import {
  Controller,
  Get,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EntitlementService } from './entitlement.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';

@ApiTags('entitlements')
@Controller('entitlements')
export class EntitlementController {
  constructor(private readonly entitlementService: EntitlementService) {}

  @Get('get-my-entitlements')
  @ApiOperation({ summary: 'Get current user entitlements' })
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard(
      ...[
        'care_company',
        'agency',
        'supplier',
        'service_provider',
        'family',
        'carer',
      ],
    ),
  )
  @HttpCode(HttpStatus.OK)
  async getMyEntitlements(@Req() req: Request) {
    const result = await this.entitlementService.getMyEntitlements(
      req.user!.id,
    );
    return {
      message: 'Entitlements retrieved successfully',
      data: result,
    };
  }
}
