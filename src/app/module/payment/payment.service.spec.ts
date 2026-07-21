import { HttpException } from '@nestjs/common';
import { PaymentService } from './payment.service';

const buildPaymentModel = () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
});

const buildUserModel = () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
});

const buildSubscribeModel = () => ({
  findById: jest.fn(),
});

const buildPackageModel = () => ({
  findById: jest.fn(),
});

const buildStripeMock = () => ({
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
});

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a package checkout payment intent', async () => {
    const paymentModel = buildPaymentModel();
    const userModel = buildUserModel();
    const subscribeModel = buildSubscribeModel();
    const packageModel = buildPackageModel();
    const stripe = buildStripeMock();

    userModel.findById.mockResolvedValue({
      _id: 'user-id',
      email: 'user@example.com',
    });
    packageModel.findById.mockResolvedValue({
      _id: 'pkg-id',
      name: 'Gold Membership',
      type: 'membership',
      price: 99.99,
      durationDays: 30,
      usageLimit: 0,
      isActive: true,
    });
    paymentModel.findOne.mockResolvedValue(null);
    stripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_123',
      client_secret: 'secret_123',
    });
    paymentModel.create.mockResolvedValue({});

    const service = new PaymentService(
      paymentModel as any,
      userModel as any,
      subscribeModel as any,
      packageModel as any,
    );
    (service as any).stripe = stripe;

    const result = await service.createPackageCheckout('user-id', 'pkg-id');

    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 9999,
        currency: 'usd',
        metadata: expect.objectContaining({
          userId: 'user-id',
          packageId: 'pkg-id',
          paymentType: 'membership',
        }),
      }),
    );
    expect(paymentModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: 'user-id',
        package: 'pkg-id',
        paymentType: 'membership',
        status: 'pending',
      }),
    );
    expect(result).toMatchObject({
      clientSecret: 'secret_123',
      paymentIntentId: 'pi_123',
      amount: 99.99,
      packageId: 'pkg-id',
    });
  });

  it('rejects checkout for inactive package', async () => {
    const paymentModel = buildPaymentModel();
    const userModel = buildUserModel();
    const subscribeModel = buildSubscribeModel();
    const packageModel = buildPackageModel();
    const stripe = buildStripeMock();

    userModel.findById.mockResolvedValue({
      _id: 'user-id',
      email: 'user@example.com',
    });
    packageModel.findById.mockResolvedValue({
      _id: 'pkg-id',
      name: 'Old Package',
      isActive: false,
    });

    const service = new PaymentService(
      paymentModel as any,
      userModel as any,
      subscribeModel as any,
      packageModel as any,
    );
    (service as any).stripe = stripe;

    await expect(
      service.createPackageCheckout('user-id', 'pkg-id'),
    ).rejects.toMatchObject<HttpException>({
      message: 'This package is no longer available',
      status: 400,
    });
  });

  it('rejects duplicate completed purchase', async () => {
    const paymentModel = buildPaymentModel();
    const userModel = buildUserModel();
    const subscribeModel = buildSubscribeModel();
    const packageModel = buildPackageModel();
    const stripe = buildStripeMock();

    userModel.findById.mockResolvedValue({
      _id: 'user-id',
      email: 'user@example.com',
    });
    packageModel.findById.mockResolvedValue({
      _id: 'pkg-id',
      name: 'Gold Membership',
      isActive: true,
    });
    paymentModel.findOne.mockResolvedValue({
      _id: 'existing-payment',
      status: 'completed',
    });

    const service = new PaymentService(
      paymentModel as any,
      userModel as any,
      subscribeModel as any,
      packageModel as any,
    );
    (service as any).stripe = stripe;

    await expect(
      service.createPackageCheckout('user-id', 'pkg-id'),
    ).rejects.toMatchObject<HttpException>({
      message: 'You have already purchased this package',
      status: 400,
    });
  });

  it('reuses existing pending payment intent', async () => {
    const paymentModel = buildPaymentModel();
    const userModel = buildUserModel();
    const subscribeModel = buildSubscribeModel();
    const packageModel = buildPackageModel();
    const stripe = buildStripeMock();

    userModel.findById.mockResolvedValue({
      _id: 'user-id',
      email: 'user@example.com',
    });
    packageModel.findById.mockResolvedValue({
      _id: 'pkg-id',
      name: 'Gold Membership',
      isActive: true,
      price: 99.99,
    });
    paymentModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      _id: 'pending-payment',
      stripePaymentIntentId: 'pi_existing',
      status: 'pending',
    });
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_existing',
      status: 'requires_payment_method',
      client_secret: 'existing_secret',
    });

    const service = new PaymentService(
      paymentModel as any,
      userModel as any,
      subscribeModel as any,
      packageModel as any,
    );
    (service as any).stripe = stripe;

    const result = await service.createPackageCheckout('user-id', 'pkg-id');

    expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      clientSecret: 'existing_secret',
      paymentIntentId: 'pi_existing',
    });
  });

  it('throws when user not found for package checkout', async () => {
    const paymentModel = buildPaymentModel();
    const userModel = buildUserModel();
    const subscribeModel = buildSubscribeModel();
    const packageModel = buildPackageModel();

    userModel.findById.mockResolvedValue(null);

    const service = new PaymentService(
      paymentModel as any,
      userModel as any,
      subscribeModel as any,
      packageModel as any,
    );

    await expect(
      service.createPackageCheckout('missing-user', 'pkg-id'),
    ).rejects.toMatchObject<HttpException>({
      message: 'User not found',
      status: 404,
    });
  });

  it('throws when package not found for checkout', async () => {
    const paymentModel = buildPaymentModel();
    const userModel = buildUserModel();
    const subscribeModel = buildSubscribeModel();
    const packageModel = buildPackageModel();

    userModel.findById.mockResolvedValue({
      _id: 'user-id',
      email: 'user@example.com',
    });
    packageModel.findById.mockResolvedValue(null);

    const service = new PaymentService(
      paymentModel as any,
      userModel as any,
      subscribeModel as any,
      packageModel as any,
    );

    await expect(
      service.createPackageCheckout('user-id', 'missing-pkg'),
    ).rejects.toMatchObject<HttpException>({
      message: 'Package not found',
      status: 404,
    });
  });
});
