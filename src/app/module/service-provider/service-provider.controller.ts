import { Controller } from '@nestjs/common';
import { ServiceProviderService } from './service-provider.service';

@Controller('service-provider')
export class ServiceProviderController {
  constructor(
    private readonly serviceProviderService: ServiceProviderService,
  ) {}
}
