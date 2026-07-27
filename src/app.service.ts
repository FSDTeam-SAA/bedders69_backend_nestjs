import { Injectable } from '@nestjs/common';
import config from './app/config';

@Injectable()
export class AppService {
  getHello() {
    return {
      name: `${config.appName} API`,
      status: 'ok',
      databaseEnabled: config.isMongoEnabled,
      docsUrl: `/api/docs`,
      openApiUrl: `/api/openapi.json`,
      version: '1.0.0',
    };
  }
}
