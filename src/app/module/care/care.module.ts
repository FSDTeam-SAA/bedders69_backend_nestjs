import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { CareController } from './care.controller';
import { CareService } from './care.service';
import { Care, CareSchema } from './entities/care.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Care.name, schema: CareSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CareController],
  providers: [CareService],
})
export class CareModule {}
