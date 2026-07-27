import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import dotenv from 'dotenv';
import { UtilsInterceptor } from './app/utils/utils.interceptor';
import { GlobalExceptionFilter } from './app/middlewares/globalErrors.filter';
import express from 'express';
import type { Response } from 'express';
import config from './app/config';
dotenv.config();

const scalarCustomCss = `
  :root {
    --scalar-radius: 8px;
  }

  .light-mode,
  .dark-mode {
    --scalar-color-accent: #0f766e;
    --scalar-button-1: #0f172a;
    --scalar-button-1-hover: #111827;
    --scalar-color-green: #047857;
    --scalar-color-blue: #2563eb;
    --scalar-color-orange: #ea580c;
    --scalar-color-red: #dc2626;
  }

  .light-mode {
    --scalar-background-1: #ffffff;
    --scalar-background-2: #f8fafc;
    --scalar-background-3: #e2e8f0;
    --scalar-color-1: #0f172a;
    --scalar-color-2: #475569;
    --scalar-color-3: #64748b;
    --scalar-border-color: rgba(15, 23, 42, 0.12);
  }

  .dark-mode {
    --scalar-background-1: #0b1020;
    --scalar-background-2: #111827;
    --scalar-background-3: #1f2937;
    --scalar-color-1: #f8fafc;
    --scalar-color-2: #cbd5e1;
    --scalar-color-3: #94a3b8;
    --scalar-border-color: rgba(226, 232, 240, 0.16);
  }
`;

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
    origin: config.corsOrigin === '*' ? true : config.corsOrigin,
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${config.appName} API`)
    .setDescription(
      `${config.appName} production API reference for authentication, profiles, directories, packages, payments, jobs, marketplace, advertisements, notifications, and admin reporting.`,
    )
    .setVersion('1.0')
    .addServer('/api/v1', 'Current API base path')
    .addTag('auth', 'Authentication and password flows')
    .addTag('profiles', 'MVP profile, directory, and approval workflows')
    .addTag('jobs', 'Recruitment job posting and public job discovery')
    .addTag('job-applications', 'Carer job applications and review workflow')
    .addTag('packages', 'Packages, paid benefits, and entitlement catalog')
    .addTag('payments', 'Stripe checkout and payment records')
    .addTag('marketplace', 'Listing-based marketplace and inquiries')
    .addTag('advertisements', 'Advertisement creation, serving, and tracking')
    .addTag('Notifications', 'Notification logs and delivery status')
    .addTag('Dashboard', 'Admin reporting and management metrics')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
  });

  app.use('/api/openapi.json', (_req, res: Response) => res.json(document));

  app.use(
    '/api/docs',
    apiReference({
      url: '/api/openapi.json',
      title: `${config.appName} API Reference`,
      slug: 'bedders-api',
      theme: 'kepler',
      layout: 'modern',
      darkMode: false,
      forceDarkModeState: 'light',
      hideDarkModeToggle: false,
      persistAuth: true,
      showSidebar: true,
      operationTitleSource: 'summary',
      showOperationId: true,
      defaultHttpClient: {
        targetKey: 'node',
        clientKey: 'fetch',
      },
      documentDownloadType: 'both',
      hideModels: false,
      modelsSectionLabel: 'Schemas',
      defaultOpenFirstTag: true,
      defaultOpenAllTags: false,
      expandAllResponses: false,
      expandAllSchemaProperties: false,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
      orderSchemaPropertiesBy: 'preserve',
      orderRequiredPropertiesFirst: true,
      authentication: {
        preferredSecurityScheme: 'access-token',
      },
      metaData: {
        title: `${config.appName} API Reference`,
        description: `${config.appName} production OpenAPI reference`,
        ogTitle: `${config.appName} API Reference`,
        ogDescription: `${config.appName} production OpenAPI reference`,
      },
      customCss: scalarCustomCss,
      telemetry: false,
    }),
  );

  await app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
    console.log(`Scalar docs: http://localhost:${config.port}/api/docs`);
    console.log(
      `OpenAPI JSON: http://localhost:${config.port}/api/openapi.json`,
    );
  });
}
bootstrap().catch(console.error);
