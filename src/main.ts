import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import dotenv from 'dotenv';
import { UtilsInterceptor } from './app/utils/utils.interceptor';
import { GlobalExceptionFilter } from './app/middlewares/globalErrors.filter';
import express from 'express';
import type { Response } from 'express';
import config from './app/config';
import {
  OPENAPI_JSON_PATH,
  SCALAR_DOCS_PATH,
  createSwaggerConfig,
  scalarReferenceConfig,
} from './app/config/api-docs';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.use('/favicon.ico', (_req, res: Response) => {
    res.status(204).end();
  });

  app.use('/api/v1/webhook', express.raw({ type: 'application/json' }));

  app.use(cookieParser());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        config.corsOrigin === '*' ||
        origin === config.corsOrigin ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [''],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new UtilsInterceptor());
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));

  const swaggerConfig = createSwaggerConfig();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    ignoreGlobalPrefix: true,
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
  });

  app.use(OPENAPI_JSON_PATH, (_req, res: Response) => res.json(document));

  app.use(SCALAR_DOCS_PATH, apiReference(scalarReferenceConfig));

  await app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
    console.log(
      `Scalar docs: http://localhost:${config.port}${SCALAR_DOCS_PATH}`,
    );
    console.log(
      `OpenAPI JSON: http://localhost:${config.port}${OPENAPI_JSON_PATH}`,
    );
  });
}
bootstrap().catch(console.error);
