import { JobApplicationService } from './job-application.service';

const buildJobApplicationModel = () => ({
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
});

const buildJobModel = () => ({
  findById: jest.fn(),
});

const buildUserModel = () => ({
  findById: jest.fn(),
});

const buildFindChain = (items: unknown[]) => ({
  populate: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(items),
});

describe('JobApplicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyToJob', () => {
    it('allows a carer to apply to an approved job', async () => {
      const applicationModel = buildJobApplicationModel();
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'carer-id',
          role: 'carer',
          status: 'active',
        }),
      });
      jobModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'job-id',
          status: 'approved',
        }),
      });
      applicationModel.findOne.mockResolvedValue(null);
      applicationModel.create.mockResolvedValue({
        _id: 'app-id',
        jobId: 'job-id',
        carerUserId: 'carer-id',
        status: 'pending',
      });

      const service = new JobApplicationService(
        applicationModel as any,
        jobModel as any,
        userModel as any,
      );

      const result = await service.applyToJob(
        'carer-id',
        'job-id',
        'I am interested',
      );
      expect(applicationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'job-id',
          carerUserId: 'carer-id',
          coverLetter: 'I am interested',
          status: 'pending',
        }),
      );
      expect(result).toMatchObject({
        _id: 'app-id',
        status: 'pending',
      });
    });

    it('prevents duplicate applications', async () => {
      const applicationModel = buildJobApplicationModel();
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'carer-id',
          role: 'carer',
          status: 'active',
        }),
      });
      jobModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'job-id',
          status: 'approved',
        }),
      });
      applicationModel.findOne.mockResolvedValue({
        _id: 'existing-app',
        jobId: 'job-id',
        carerUserId: 'carer-id',
      });

      const service = new JobApplicationService(
        applicationModel as any,
        jobModel as any,
        userModel as any,
      );

      await expect(
        service.applyToJob('carer-id', 'job-id'),
      ).rejects.toMatchObject({
        message: 'You have already applied to this job',
        status: 400,
      });
      expect(applicationModel.create).not.toHaveBeenCalled();
    });

    it('rejects non-carer users', async () => {
      const applicationModel = buildJobApplicationModel();
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'org-id',
          role: 'care_company',
          status: 'active',
        }),
      });

      const service = new JobApplicationService(
        applicationModel as any,
        jobModel as any,
        userModel as any,
      );

      await expect(
        service.applyToJob('org-id', 'job-id'),
      ).rejects.toMatchObject({
        message: 'Only carers can apply to jobs',
        status: 403,
      });
    });

    it('rejects application to non-approved job', async () => {
      const applicationModel = buildJobApplicationModel();
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'carer-id',
          role: 'carer',
          status: 'active',
        }),
      });
      jobModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'job-id',
          status: 'draft',
        }),
      });

      const service = new JobApplicationService(
        applicationModel as any,
        jobModel as any,
        userModel as any,
      );

      await expect(
        service.applyToJob('carer-id', 'job-id'),
      ).rejects.toMatchObject({
        message: 'You can only apply to approved jobs',
        status: 400,
      });
    });
  });

  describe('getJobApplications', () => {
    it('returns applications for a job owned by the organization', async () => {
      const applicationModel = buildJobApplicationModel();
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      jobModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'job-id',
          organizationUserId: 'org-user-id',
        }),
      });
      applicationModel.countDocuments.mockResolvedValue(2);
      applicationModel.find.mockReturnValue(
        buildFindChain([
          { _id: 'app-1', jobId: 'job-id', carerUserId: 'carer-1' },
          { _id: 'app-2', jobId: 'job-id', carerUserId: 'carer-2' },
        ]),
      );

      const service = new JobApplicationService(
        applicationModel as any,
        jobModel as any,
        userModel as any,
      );

      const result = await service.getJobApplications('job-id', 'org-user-id', {
        page: 1,
        limit: 10,
      });
      expect(result.meta.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it('rejects non-owner accessing applications', async () => {
      const applicationModel = buildJobApplicationModel();
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      jobModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'job-id',
          organizationUserId: 'other-org-id',
        }),
      });

      const service = new JobApplicationService(
        applicationModel as any,
        jobModel as any,
        userModel as any,
      );

      await expect(
        service.getJobApplications('job-id', 'org-user-id', {
          page: 1,
          limit: 10,
        }),
      ).rejects.toMatchObject({
        message: 'You can only view applications for your own jobs',
        status: 403,
      });
    });
  });

  describe('updateApplicationStatus', () => {
    it('updates application status', async () => {
      const applicationModel = buildJobApplicationModel();
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const mockApplication = {
        _id: 'app-id',
        jobId: 'job-id',
        status: 'pending',
        save: jest.fn().mockResolvedValue(undefined),
      };
      applicationModel.findById.mockResolvedValue(mockApplication);
      jobModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'job-id',
          organizationUserId: 'org-user-id',
        }),
      });

      const service = new JobApplicationService(
        applicationModel as any,
        jobModel as any,
        userModel as any,
      );

      const result = await service.updateApplicationStatus(
        'app-id',
        'org-user-id',
        'shortlisted',
        'Strong profile',
      );
      expect(mockApplication.status).toBe('shortlisted');
      expect(mockApplication.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        applicationId: 'app-id',
        status: 'shortlisted',
      });
    });

    it('rejects invalid status', async () => {
      const applicationModel = buildJobApplicationModel();
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      applicationModel.findById.mockResolvedValue({
        _id: 'app-id',
        jobId: 'job-id',
        status: 'pending',
      });
      jobModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'job-id',
          organizationUserId: 'org-user-id',
        }),
      });

      const service = new JobApplicationService(
        applicationModel as any,
        jobModel as any,
        userModel as any,
      );

      await expect(
        service.updateApplicationStatus(
          'app-id',
          'org-user-id',
          'invalid_status',
        ),
      ).rejects.toMatchObject({
        message: expect.stringContaining('Invalid status'),
        status: 400,
      });
    });
  });

  describe('withdrawApplication', () => {
    it('allows carer to withdraw their own application', async () => {
      const applicationModel = buildJobApplicationModel();
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      const mockApplication = {
        _id: 'app-id',
        carerUserId: 'carer-id',
        status: 'pending',
        save: jest.fn().mockResolvedValue(undefined),
      };
      applicationModel.findById.mockResolvedValue(mockApplication);

      const service = new JobApplicationService(
        applicationModel as any,
        jobModel as any,
        userModel as any,
      );

      const result = await service.withdrawApplication('app-id', 'carer-id');
      expect(mockApplication.status).toBe('withdrawn');
      expect(result).toMatchObject({
        applicationId: 'app-id',
        status: 'withdrawn',
      });
    });

    it('prevents withdrawing another carers application', async () => {
      const applicationModel = buildJobApplicationModel();
      const jobModel = buildJobModel();
      const userModel = buildUserModel();
      applicationModel.findById.mockResolvedValue({
        _id: 'app-id',
        carerUserId: 'other-carer-id',
        status: 'pending',
      });

      const service = new JobApplicationService(
        applicationModel as any,
        jobModel as any,
        userModel as any,
      );

      await expect(
        service.withdrawApplication('app-id', 'carer-id'),
      ).rejects.toMatchObject({
        message: 'You can only withdraw your own applications',
        status: 403,
      });
    });
  });
});
