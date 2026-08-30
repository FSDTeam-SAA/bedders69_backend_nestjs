import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from '../job/entities/job.entity';
import {
  JobApplication,
  JobApplicationSchema,
} from '../job-application/entities/job-application.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { Company, CompanySchema } from './entities/company.entity';
import {
  ContactRequest,
  ContactRequestSchema,
} from './entities/contact-request.entity';
import { SavedCarer, SavedCarerSchema } from './entities/saved-carer.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: SavedCarer.name, schema: SavedCarerSchema },
      { name: ContactRequest.name, schema: ContactRequestSchema },
      { name: Job.name, schema: JobSchema },
      { name: JobApplication.name, schema: JobApplicationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
