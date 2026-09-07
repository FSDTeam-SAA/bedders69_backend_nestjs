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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { CareSkillService } from './care-skill.service';
import { CreateCareSkillDto } from './dto/create-care-skill.dto';
import { UpdateCareSkillDto } from './dto/update-care-skill.dto';

@ApiTags('care-skill')
@Controller('care-skills')
export class CareSkillController {
  constructor(private readonly careSkillService: CareSkillService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new care skill' })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateCareSkillDto })
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async createCareSkill(@Body() dto: CreateCareSkillDto) {
    const result = await this.careSkillService.createCareSkill(dto);
    return {
      message: 'Care skill created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all care skills' })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getAllCareSkills(
    @Req() req: Request,
    @Query('search') search?: string,
  ) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.careSkillService.getAllCareSkills(options, search);
    return {
      message: 'Care skills retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single care skill by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Care Skill ID' })
  async getSingleCareSkill(@Param('id') id: string) {
    const result = await this.careSkillService.getSingleCareSkill(id);
    return {
      message: 'Care skill retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update care skill' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, description: 'Care Skill ID' })
  @ApiBody({ type: UpdateCareSkillDto })
  @UseGuards(AuthGuard('admin'))
  async updateCareSkill(
    @Param('id') id: string,
    @Body() dto: UpdateCareSkillDto,
  ) {
    const result = await this.careSkillService.updateCareSkill(id, dto);
    return {
      message: 'Care skill updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete care skill' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, description: 'Care Skill ID' })
  @UseGuards(AuthGuard('admin'))
  async deleteCareSkill(@Param('id') id: string) {
    const result = await this.careSkillService.deleteCareSkill(id);
    return {
      message: 'Care skill deleted successfully',
      data: result,
    };
  }
}
