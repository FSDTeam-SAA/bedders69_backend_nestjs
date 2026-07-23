import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { Agency, AgencySchema } from './entities/agency.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Agency.name, schema: AgencySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AgencyController],
  providers: [AgencyService],
})
export class AgencyModule {}
