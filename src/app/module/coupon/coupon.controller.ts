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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@ApiTags('coupon')
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @ApiOperation({ summary: 'Create coupon' })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateCouponDto })
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCouponDto: CreateCouponDto) {
    const result = await this.couponService.create(createCouponDto);

    return {
      message: 'Coupon created successfully',
      data: result,
    };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate coupon and calculate discounts' })
  @ApiBody({ type: ValidateCouponDto })
  @HttpCode(HttpStatus.OK)
  async validate(@Body() validateCouponDto: ValidateCouponDto) {
    const result = await this.couponService.validateCoupon(validateCouponDto);

    return {
      message: 'Coupon validated successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all coupons' })
  async findAll() {
    const result = await this.couponService.findAll();

    return {
      message: 'Coupons retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single coupon by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Coupon ID' })
  async findOne(@Param('id') id: string) {
    const result = await this.couponService.findOne(id);

    return {
      message: 'Coupon retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update coupon' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, description: 'Coupon ID' })
  @ApiBody({ type: UpdateCouponDto })
  @UseGuards(AuthGuard('admin'))
  async update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    const result = await this.couponService.update(id, updateCouponDto);

    return {
      message: 'Coupon updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete coupon' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: String, description: 'Coupon ID' })
  @UseGuards(AuthGuard('admin'))
  async remove(@Param('id') id: string) {
    const result = await this.couponService.remove(id);

    return {
      message: 'Coupon deleted successfully',
      data: result,
    };
  }
}
