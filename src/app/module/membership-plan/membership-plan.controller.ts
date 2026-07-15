import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import { MembershipPlanService } from './membership-plan.service';

@ApiTags('membership-plan')
@Controller('membership-plans')
export class MembershipPlanController {
  constructor(
    private readonly membershipPlanService: MembershipPlanService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create membership plan' })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateMembershipPlanDto })
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMembershipPlanDto: CreateMembershipPlanDto) {
    const result =
      await this.membershipPlanService.create(createMembershipPlanDto);

    return {
      message: 'Membership plan created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all membership plans' })
  async findAll() {
    const result = await this.membershipPlanService.findAll();

    return {
      message: 'Membership plans retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update membership plan' })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: UpdateMembershipPlanDto })
  @UseGuards(AuthGuard('admin'))
  async update(
    @Param('id') id: string,
    @Body() updateMembershipPlanDto: UpdateMembershipPlanDto,
  ) {
    const result = await this.membershipPlanService.update(
      id,
      updateMembershipPlanDto,
    );

    return {
      message: 'Membership plan updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete membership plan' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  async remove(@Param('id') id: string) {
    const result = await this.membershipPlanService.remove(id);

    return {
      message: 'Membership plan deleted successfully',
      data: result,
    };
  }
}
