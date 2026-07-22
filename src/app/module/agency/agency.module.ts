import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { Agency, AgencySchema } from './entities/agency.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Agency.name, schema: AgencySchema }]),
  ],
  controllers: [AgencyController],
  providers: [AgencyService],
})
export class AgencyModule {}
