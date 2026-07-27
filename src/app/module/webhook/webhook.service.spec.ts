import { WebhookService } from './webhook.service';

const buildUserModel = () => ({
  findById: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue({
      _id: 'user-id',
      fullName: 'Care User',
      email: 'user@example.com',
    }),
  }),
});

const buildPaymentModel = () => ({
  findOne: jest.fn(),
});

const buildSubscribeModel = () => ({
  findById: jest.fn(),
});

const buildPackageModel = () => ({
  findById: jest.fn(),
});

const buildEntitlementModel = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
});

const buildNotificationService = () => ({
  notifyEmail: jest.fn().mockResolvedValue({ _id: 'notification-id' }),
});

const buildResponse = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  }) as any;

describe('WebhookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('activates entitlement on successful package payment', async () => {
    const userModel = buildUserModel();
    const paymentModel = buildPaymentModel();
    const subscribeModel = buildSubscribeModel();
    const packageModel = buildPackageModel();
    const entitlementModel = buildEntitlementModel();
    const res = buildResponse();

    const mockPayment = {
      _id: 'payment-id',
      user: 'user-id',
      package: 'pkg-id',
      paymentType: 'membership',
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined),
    };
    paymentModel.findOne.mockResolvedValue(mockPayment);

    const mockPackage = {
      _id: 'pkg-id',
      type: 'membership',
      durationDays: 30,
      usageLimit: 0,
    };
    packageModel.findById.mockResolvedValue(mockPackage);
    entitlementModel.findOne.mockResolvedValue(null);
    entitlementModel.create.mockResolvedValue({
      _id: 'entitlement-id',
      user: 'user-id',
      package: 'pkg-id',
      status: 'active',
    });

    const service = new WebhookService(
      userModel as any,
      paymentModel as any,
      subscribeModel as any,
      packageModel as any,
      entitlementModel as any,
      buildNotificationService() as any,
    );

    const event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          metadata: {
            userId: 'user-id',
            packageId: 'pkg-id',
            paymentType: 'membership',
          },
        },
      },
    } as any;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await (service as any).handlePaymentIntentSucceeded(event, res);

    expect(mockPayment.status).toBe('completed');
    expect(mockPayment.save).toHaveBeenCalled();
    expect(entitlementModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: 'user-id',
        package: 'pkg-id',
        status: 'active',
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        received: true,
        type: 'package',
      }),
    );
  });

  it('skips already completed payment (idempotent)', async () => {
    const userModel = buildUserModel();
    const paymentModel = buildPaymentModel();
    const subscribeModel = buildSubscribeModel();
    const packageModel = buildPackageModel();
    const entitlementModel = buildEntitlementModel();
    const res = buildResponse();

    const mockPayment = {
      _id: 'payment-id',
      user: 'user-id',
      package: 'pkg-id',
      status: 'completed',
    };
    paymentModel.findOne.mockResolvedValue(mockPayment);

    const service = new WebhookService(
      userModel as any,
      paymentModel as any,
      subscribeModel as any,
      packageModel as any,
      entitlementModel as any,
      buildNotificationService() as any,
    );

    const event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          metadata: {},
        },
      },
    } as any;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await (service as any).handlePaymentIntentSucceeded(event, res);

    expect(mockPayment.save).toBeUndefined();
    expect(entitlementModel.create).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('does not create duplicate entitlement (idempotent)', async () => {
    const userModel = buildUserModel();
    const paymentModel = buildPaymentModel();
    const subscribeModel = buildSubscribeModel();
    const packageModel = buildPackageModel();
    const entitlementModel = buildEntitlementModel();
    const res = buildResponse();

    const mockPayment = {
      _id: 'payment-id',
      user: 'user-id',
      package: 'pkg-id',
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined),
    };
    paymentModel.findOne.mockResolvedValue(mockPayment);

    const mockPackage = {
      _id: 'pkg-id',
      type: 'membership',
      durationDays: 30,
    };
    packageModel.findById.mockResolvedValue(mockPackage);

    const existingEntitlement = {
      _id: 'existing-entitlement',
      user: 'user-id',
      package: 'pkg-id',
      status: 'active',
    };
    entitlementModel.findOne.mockResolvedValue(existingEntitlement);

    const service = new WebhookService(
      userModel as any,
      paymentModel as any,
      subscribeModel as any,
      packageModel as any,
      entitlementModel as any,
      buildNotificationService() as any,
    );

    const event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          metadata: {},
        },
      },
    } as any;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await (service as any).handlePaymentIntentSucceeded(event, res);

    expect(entitlementModel.create).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('marks payment as failed on payment_intent.payment_failed', async () => {
    const userModel = buildUserModel();
    const paymentModel = buildPaymentModel();
    const subscribeModel = buildSubscribeModel();
    const packageModel = buildPackageModel();
    const entitlementModel = buildEntitlementModel();
    const res = buildResponse();

    const mockPayment = {
      _id: 'payment-id',
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined),
    };
    paymentModel.findOne.mockResolvedValue(mockPayment);

    const service = new WebhookService(
      userModel as any,
      paymentModel as any,
      subscribeModel as any,
      packageModel as any,
      entitlementModel as any,
      buildNotificationService() as any,
    );

    const event = {
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_123',
        },
      },
    } as any;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await (service as any).handlePaymentIntentFailed(event, res);

    expect(mockPayment.status).toBe('failed');
    expect(mockPayment.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });
});
