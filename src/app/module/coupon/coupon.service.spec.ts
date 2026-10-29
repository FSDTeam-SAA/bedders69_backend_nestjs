import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CouponService } from './coupon.service';
import { Coupon, CouponAppliesTo } from './entities/coupon.entity';

describe('CouponService', () => {
  let service: CouponService;
  let mockCouponModel: any;

  beforeEach(async () => {
    mockCouponModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        {
          provide: getModelToken(Coupon.name),
          useValue: mockCouponModel,
        },
      ],
    }).compile();

    service = module.get<CouponService>(CouponService);
  });

  describe('Backward compatibility', () => {
    it('defaults appliesTo to ALL if missing in coupon data', async () => {
      mockCouponModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          {
            toObject: () => ({
              _id: '1',
              couponCode: 'LEGACY10',
              discountValue: 10,
            }),
          },
        ]),
      });

      const result = await service.findAll();
      expect(result[0].appliesTo).toBe(CouponAppliesTo.ALL);
    });
  });

  describe('Category Validation & Error Handling', () => {
    const validFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const validPast = new Date(Date.now() - 1000 * 60 * 60 * 24);

    it('rejects with "This coupon is not valid for this item." when PRODUCT coupon is used for SUBSCRIPTION', async () => {
      mockCouponModel.findOne.mockResolvedValue({
        _id: '1',
        couponCode: 'PROD10',
        discountValue: 10,
        appliesTo: CouponAppliesTo.PRODUCT,
        startDate: validPast,
        expiryDate: validFuture,
        totalUsageLimit: 100,
        usedCount: 0,
      });

      await expect(
        service.validateCoupon({
          couponCode: 'PROD10',
          category: CouponAppliesTo.SUBSCRIPTION,
          amount: 49,
        }),
      ).rejects.toThrow(
        new HttpException(
          'This coupon is not valid for this item.',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('rejects with "This coupon is not valid for this item." when SUBSCRIPTION coupon is used for PRODUCT', async () => {
      mockCouponModel.findOne.mockResolvedValue({
        _id: '2',
        couponCode: 'SUB20',
        discountValue: 20,
        appliesTo: CouponAppliesTo.SUBSCRIPTION,
        startDate: validPast,
        expiryDate: validFuture,
        totalUsageLimit: 100,
        usedCount: 0,
      });

      await expect(
        service.validateCoupon({
          couponCode: 'SUB20',
          category: CouponAppliesTo.PRODUCT,
          productAmount: 100,
        }),
      ).rejects.toThrow(
        new HttpException(
          'This coupon is not valid for this item.',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('rejects with "This coupon is not valid for this item." when DELIVERY coupon is applied with 0 delivery fee', async () => {
      mockCouponModel.findOne.mockResolvedValue({
        _id: '3',
        couponCode: 'SHIPFREE',
        discountValue: 100,
        appliesTo: CouponAppliesTo.DELIVERY,
        startDate: validPast,
        expiryDate: validFuture,
        totalUsageLimit: 100,
        usedCount: 0,
      });

      await expect(
        service.validateCoupon({
          couponCode: 'SHIPFREE',
          productAmount: 50,
          deliveryFee: 0,
        }),
      ).rejects.toThrow(
        new HttpException(
          'This coupon is not valid for this item.',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('rejects an expired coupon', async () => {
      const past = new Date(Date.now() - 1000 * 60 * 60 * 24);
      mockCouponModel.findOne.mockResolvedValue({
        _id: 'exp-1',
        couponCode: 'EXPIRED10',
        discountValue: 10,
        appliesTo: CouponAppliesTo.ALL,
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 48),
        expiryDate: past,
        totalUsageLimit: 100,
        usedCount: 0,
      });

      await expect(
        service.validateCoupon({ couponCode: 'EXPIRED10', amount: 50 }),
      ).rejects.toThrow(
        new HttpException('This coupon has expired', HttpStatus.BAD_REQUEST),
      );
    });

    it('rejects when usage limit is reached', async () => {
      mockCouponModel.findOne.mockResolvedValue({
        _id: 'limit-1',
        couponCode: 'LIMIT10',
        discountValue: 10,
        appliesTo: CouponAppliesTo.ALL,
        startDate: validPast,
        expiryDate: validFuture,
        totalUsageLimit: 5,
        usedCount: 5,
      });

      await expect(
        service.validateCoupon({ couponCode: 'LIMIT10', amount: 50 }),
      ).rejects.toThrow(
        new HttpException(
          'This coupon usage limit has been reached',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('rejects when minimum purchase amount is not met', async () => {
      mockCouponModel.findOne.mockResolvedValue({
        _id: 'min-1',
        couponCode: 'MIN50',
        discountValue: 15,
        appliesTo: CouponAppliesTo.PRODUCT,
        minPurchaseAmount: 50,
        startDate: validPast,
        expiryDate: validFuture,
        totalUsageLimit: 100,
        usedCount: 0,
      });

      await expect(
        service.validateCoupon({
          couponCode: 'MIN50',
          category: CouponAppliesTo.PRODUCT,
          productAmount: 30,
        }),
      ).rejects.toThrow(
        new HttpException(
          'Minimum purchase of £50.00 required for this coupon',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('Mixed Cart Calculations', () => {
    const validFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const validPast = new Date(Date.now() - 1000 * 60 * 60 * 24);

    it('DELIVERY coupon only discounts the delivery fee and leaves product price untouched', async () => {
      mockCouponModel.findOne.mockResolvedValue({
        _id: 'del-1',
        couponCode: 'FREESHIP',
        discountValue: 100,
        appliesTo: CouponAppliesTo.DELIVERY,
        startDate: validPast,
        expiryDate: validFuture,
        totalUsageLimit: 100,
        usedCount: 0,
      });

      const res = await service.validateCoupon({
        couponCode: 'FREESHIP',
        productAmount: 80,
        deliveryFee: 10,
      });

      expect(res.deliveryDiscount).toBe(10);
      expect(res.productDiscount).toBe(0);
      expect(res.finalDeliveryFee).toBe(0);
      expect(res.finalProductAmount).toBe(80);
      expect(res.finalTotal).toBe(80);
    });

    it('PRODUCT coupon only discounts the product amount and leaves delivery fee untouched', async () => {
      mockCouponModel.findOne.mockResolvedValue({
        _id: 'prod-1',
        couponCode: 'PROD25',
        discountValue: 25,
        appliesTo: CouponAppliesTo.PRODUCT,
        startDate: validPast,
        expiryDate: validFuture,
        totalUsageLimit: 100,
        usedCount: 0,
      });

      const res = await service.validateCoupon({
        couponCode: 'PROD25',
        productAmount: 100,
        deliveryFee: 15,
      });

      expect(res.productDiscount).toBe(25);
      expect(res.deliveryDiscount).toBe(0);
      expect(res.finalProductAmount).toBe(75);
      expect(res.finalDeliveryFee).toBe(15);
      expect(res.finalTotal).toBe(90);
    });

    it('ALL coupon discounts both product and delivery fee', async () => {
      mockCouponModel.findOne.mockResolvedValue({
        _id: 'all-1',
        couponCode: 'ALL10',
        discountValue: 10,
        appliesTo: CouponAppliesTo.ALL,
        startDate: validPast,
        expiryDate: validFuture,
        totalUsageLimit: 100,
        usedCount: 0,
      });

      const res = await service.validateCoupon({
        couponCode: 'ALL10',
        productAmount: 100,
        deliveryFee: 20,
      });

      expect(res.productDiscount).toBe(10);
      expect(res.deliveryDiscount).toBe(2);
      expect(res.totalDiscount).toBe(12);
      expect(res.finalProductAmount).toBe(90);
      expect(res.finalDeliveryFee).toBe(18);
      expect(res.finalTotal).toBe(108);
    });

    it('records coupon usage by incrementing usedCount', async () => {
      mockCouponModel.findOneAndUpdate.mockResolvedValue({
        couponCode: 'USED1',
        usedCount: 1,
      });

      const res = await service.recordUsage('USED1');
      expect(mockCouponModel.findOneAndUpdate).toHaveBeenCalledWith(
        { couponCode: 'USED1' },
        { $inc: { usedCount: 1 } },
        { new: true },
      );
      expect(res?.usedCount).toBe(1);
    });
  });
});
