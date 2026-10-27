import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { Care, CareSchema } from '../care/entities/care.entity';
import { Company, CompanySchema } from '../company/entities/company.entity';
import { Agency, AgencySchema } from '../agency/entities/agency.entity';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Care.name, schema: CareSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Agency.name, schema: AgencySchema },
    ]),
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
