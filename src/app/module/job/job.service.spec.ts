import { JobService } from './job.service';

const buildJobModel = () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
});

const buildUserModel = () => ({
  findById: jest.fn(),
});

const buildJobAuditLogModel = () => ({
  create: jest.fn(),
});

const buildEntitlementModel = () => ({
  findOne: jest.fn(),
});

const buildFindChain = (items: unknown[]) => ({
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(items),
});

describe('JobService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('creates a job for an active organization user', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'org-user-id',
          role: 'care_company',
          status: 'active',
        }),
      });
      jobModel.create.mockResolvedValue({
        _id: 'job-id',
        title: 'Care Assistant',
        organizationUserId: 'org-user-id',
        status: 'draft',
        isPublished: false,
      });

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      const result = await service.createJob('org-user-id', {
        title: 'Care Assistant',
        description: 'Full time care role',
      });

      expect(jobModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Care Assistant',
          description: 'Full time care role',
          organizationUserId: 'org-user-id',
          status: 'draft',
          isPublished: false,
        }),
      );
      expect(result).toMatchObject({
        _id: 'job-id',
        title: 'Care Assistant',
        status: 'draft',
      });
    });

    it('rejects job creation for non-organization users', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'carer-user-id',
          role: 'carer',
          status: 'active',
        }),
      });

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      await expect(
        service.createJob('carer-user-id', { title: 'Test Job' }),
      ).rejects.toMatchObject({
        message: 'Only organizations can post jobs',
        status: 403,
      });
      expect(jobModel.create).not.toHaveBeenCalled();
    });

    it('rejects job creation for inactive users', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'org-user-id',
          role: 'agency',
          status: 'suspended',
        }),
      });

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      await expect(
        service.createJob('org-user-id', { title: 'Test Job' }),
      ).rejects.toMatchObject({
        message: 'Your account must be active to post jobs',
        status: 403,
      });
    });
  });

  describe('updateJob', () => {
    it('updates a draft job', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      const mockJob = {
        _id: 'job-id',
        organizationUserId: 'org-user-id',
        status: 'draft',
      };
      jobModel.findById.mockResolvedValue(mockJob);
      jobModel.findByIdAndUpdate.mockResolvedValue({
        ...mockJob,
        title: 'Updated Title',
      });

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      const result = await service.updateJob('job-id', 'org-user-id', {
        title: 'Updated Title',
      });
      expect(result).toMatchObject({ title: 'Updated Title' });
    });

    it('rejects update from non-owner', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      jobModel.findById.mockResolvedValue({
        _id: 'job-id',
        organizationUserId: 'other-org-id',
        status: 'draft',
      });

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      await expect(
        service.updateJob('job-id', 'org-user-id', { title: 'Hacked' }),
      ).rejects.toMatchObject({
        message: 'You can only update your own jobs',
        status: 403,
      });
    });

    it('rejects update on published job', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      jobModel.findById.mockResolvedValue({
        _id: 'job-id',
        organizationUserId: 'org-user-id',
        status: 'published',
      });

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      await expect(
        service.updateJob('job-id', 'org-user-id', { title: 'Hacked' }),
      ).rejects.toMatchObject({
        message: 'Cannot edit a published or approved job. Close it first.',
        status: 400,
      });
    });
  });

  describe('publishJob', () => {
    it('sets job to pending_approval', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      const mockJob = {
        _id: 'job-id',
        organizationUserId: 'org-user-id',
        status: 'draft',
        isPublished: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      jobModel.findById.mockResolvedValue(mockJob);

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      await service.publishJob('job-id', 'org-user-id');
      expect(mockJob.status).toBe('pending_approval');
      expect(mockJob.save).toHaveBeenCalled();
    });

    it('rejects publishing already published job', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      jobModel.findById.mockResolvedValue({
        _id: 'job-id',
        organizationUserId: 'org-user-id',
        status: 'published',
      });

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      await expect(
        service.publishJob('job-id', 'org-user-id'),
      ).rejects.toMatchObject({
        message: 'Job is already published',
        status: 400,
      });
    });
  });

  describe('closeJob', () => {
    it('closes a job', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      const mockJob = {
        _id: 'job-id',
        organizationUserId: 'org-user-id',
        status: 'approved',
        isPublished: true,
        save: jest.fn().mockResolvedValue(undefined),
      };
      jobModel.findById.mockResolvedValue(mockJob);

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      await service.closeJob('job-id', 'org-user-id');
      expect(mockJob.status).toBe('closed');
      expect(mockJob.isPublished).toBe(false);
      expect(mockJob.save).toHaveBeenCalled();
    });
  });

  describe('approveJob', () => {
    it('approves a pending_approval job', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      const mockJob = {
        _id: 'job-id',
        status: 'pending_approval',
        isPublished: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      jobModel.findById.mockResolvedValue(mockJob);
      jobAuditLogModel.create.mockResolvedValue({});

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      const result = await service.approveJob(
        'admin-id',
        'job-id',
        'Looks good',
      );
      expect(mockJob.status).toBe('approved');
      expect(mockJob.isPublished).toBe(true);
      expect(mockJob.publishedAt).toBeInstanceOf(Date);
      expect(jobAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorUserId: 'admin-id',
          jobId: 'job-id',
          action: 'approve-job',
          previousStatus: 'pending_approval',
          nextStatus: 'approved',
          reason: 'Looks good',
        }),
      );
      expect(result).toMatchObject({
        status: 'approved',
        action: 'approve-job',
      });
    });

    it('rejects approving a non-pending job', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      jobModel.findById.mockResolvedValue({
        _id: 'job-id',
        status: 'draft',
      });

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      await expect(
        service.approveJob('admin-id', 'job-id'),
      ).rejects.toMatchObject({
        message: 'Only jobs pending approval can be approved',
        status: 400,
      });
    });
  });

  describe('rejectJob', () => {
    it('rejects a pending_approval job', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      const mockJob = {
        _id: 'job-id',
        status: 'pending_approval',
        isPublished: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      jobModel.findById.mockResolvedValue(mockJob);
      jobAuditLogModel.create.mockResolvedValue({});

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      const result = await service.rejectJob(
        'admin-id',
        'job-id',
        'Incomplete',
      );
      expect(mockJob.status).toBe('rejected');
      expect(mockJob.isPublished).toBe(false);
      expect(jobAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reject-job',
          nextStatus: 'rejected',
        }),
      );
      expect(result).toMatchObject({
        status: 'rejected',
        action: 'reject-job',
      });
    });
  });

  describe('searchJobs', () => {
    it('returns approved published jobs', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      jobModel.countDocuments.mockResolvedValue(1);
      jobModel.find.mockReturnValue(
        buildFindChain([
          { _id: 'job-1', title: 'Care Assistant', status: 'approved' },
        ]),
      );

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      const result = await service.searchJobs(
        { search: 'care' },
        { page: 1, limit: 10 },
      );

      expect(jobModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved', isPublished: true }),
      );
      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getJob', () => {
    it('returns a job by id', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      jobModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: 'job-id',
            title: 'Care Assistant',
            organizationUserId: {
              _id: 'org-id',
              fullName: 'Test Org',
              email: 'org@test.com',
            },
          }),
        }),
      });

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      const result = await service.getJob('job-id');
      expect(result).toMatchObject({
        id: 'job-id',
        title: 'Care Assistant',
      });
    });

    it('throws when job not found', async () => {
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const jobAuditLogModel = buildJobAuditLogModel();
      const entitlementModel = buildEntitlementModel();
      jobModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const service = new JobService(
        jobModel as any,
        userModel as any,
        jobAuditLogModel as any,
        entitlementModel as any,
      );

      await expect(service.getJob('missing-id')).rejects.toMatchObject({
        message: 'Job not found',
        status: 404,
      });
    });
  });
});
