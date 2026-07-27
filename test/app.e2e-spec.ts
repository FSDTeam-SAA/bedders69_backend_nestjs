import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import type { Request, Response } from 'express';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import config from '../src/app/config';
import { UtilsInterceptor } from '../src/app/utils/utils.interceptor';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use('/favicon.ico', (_req: Request, res: Response) => {
      res.status(204).end();
    });
    app.setGlobalPrefix('api/v1', {
      exclude: [''],
    });
    app.useGlobalInterceptors(new UtilsInterceptor());
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({
        statusCode: 200,
        success: true,
        message: 'Request successfully completed',
        data: {
          name: `${config.appName} API`,
          status: 'ok',
          databaseEnabled: true,
          docsUrl: '/api/docs',
          openApiUrl: '/api/openapi.json',
          version: '1.0.0',
        },
      });
  });

  it('/favicon.ico (GET)', () => {
    return request(app.getHttpServer()).get('/favicon.ico').expect(204);
  });
});
