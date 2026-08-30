import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './entities/job.entity';
import { SavedJob, SavedJobSchema } from './entities/saved-job.entity';
import {
  JobAuditLog,
  JobAuditLogSchema,
} from './entities/job-audit-log.entity';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  Entitlement,
  EntitlementSchema,
} from '../entitlement/entities/entitlement.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: SavedJob.name, schema: SavedJobSchema },
      { name: JobAuditLog.name, schema: JobAuditLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Entitlement.name, schema: EntitlementSchema },
    ]),
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService, MongooseModule],
})
export class JobModule {}
