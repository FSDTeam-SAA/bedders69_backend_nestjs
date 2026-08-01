import { DocumentBuilder } from '@nestjs/swagger';
import type { NestJSReferenceConfiguration } from '@scalar/nestjs-api-reference';
import config from '.';

export const API_BASE_PATH = '/api/v1';
export const OPENAPI_JSON_PATH = '/api/openapi.json';
export const SCALAR_DOCS_PATH = '/api/docs';

const openApiDescription = `
Bedders production API reference for the backend platform.

Use this reference to test authentication, profile onboarding, directories, packages, payments, jobs, marketplace listings, advertisements, notifications, and admin reporting.

Authentication:
- Login or register through the Auth endpoints.
- Copy the returned access token into the Authorize panel.
- Protected endpoints require the Bearer JWT security scheme.

Request format:
- JSON endpoints use application/json.
- Profile, agency, product supplier, service provider, company, family, care, and advertisement asset endpoints may use multipart/form-data for file uploads.
- All application routes are served under ${API_BASE_PATH}.
`.trim();

const openApiTags: Array<[name: string, description: string]> = [
  ['Auth', 'Registration, login, refresh token, logout, and password flows.'],
  ['User', 'User administration, profile access, and account management.'],
  [
    'Family',
    'Family profile onboarding, document upload, and self-service updates.',
  ],
  [
    'Care',
    'Carer profile onboarding, experience details, and self-service updates.',
  ],
  ['Company', 'Care company profile onboarding and updates.'],
  ['Agency', 'Recruitment agency profile onboarding and updates.'],
  ['Product Supplier', 'Supplier profile onboarding and updates.'],
  ['Service Provider', 'Service provider profile onboarding and updates.'],
  [
    'Profiles',
    'Public directories, restricted searches, and admin profile moderation.',
  ],
  ['membership-plan', 'Membership plan catalog management.'],
  ['packages', 'Paid package catalog, usage limits, and benefit definitions.'],
  ['entitlements', 'Purchased package entitlements and usage tracking.'],
  ['payment', 'Stripe payment intent creation and payment record lookup.'],
  ['webhook', 'Stripe webhook processing for successful and failed payments.'],
  ['jobs', 'Job creation, publishing, public search, and admin moderation.'],
  [
    'job-applications',
    'Carer applications, withdrawals, employer review, and admin listing.',
  ],
  [
    'marketplace',
    'Marketplace listings, inquiries, public search, and admin moderation.',
  ],
  [
    'advertisements',
    'Advertisement creation, asset upload, serving, tracking, and moderation.',
  ],
  ['Notifications', 'Notification delivery logs and operational audit trail.'],
  [
    'Dashboard',
    'Admin metrics, reports, approvals, revenue, jobs, marketplace, and coupons.',
  ],
  ['contact', 'Public contact submissions and admin contact management.'],
  ['subscribe', 'Subscription/newsletter plan management.'],
  ['coupon', 'Coupon management APIs.'],
  ['service', 'Service catalog APIs for service providers.'],
  ['product-category', 'Product category management APIs.'],
  ['product', 'Product catalog APIs for suppliers and public browsing.'],
];

export const createSwaggerConfig = () => {
  const builder = new DocumentBuilder()
    .setOpenAPIVersion('3.1.0')
    .setTitle(`${config.appName} API`)
    .setDescription(openApiDescription)
    .setVersion('1.0.0')
    .addServer(API_BASE_PATH, 'Current environment API base path')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description:
          'Paste only the JWT access token. Scalar will send it as Authorization: Bearer <token>.',
        in: 'header',
      },
      'access-token',
    );

  openApiTags.forEach(([name, description]) => {
    builder.addTag(name, description);
  });

  return builder.build();
};

export const scalarCustomCss = `
  :root {
    --scalar-radius: 8px;
    --scalar-font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .light-mode,
  .dark-mode {
    --scalar-color-accent: #0f766e;
    --scalar-button-1: #0f172a;
    --scalar-button-1-color: #ffffff;
    --scalar-button-1-hover: #111827;
    --scalar-color-green: #047857;
    --scalar-color-blue: #2563eb;
    --scalar-color-orange: #ea580c;
    --scalar-color-red: #dc2626;
    --scalar-color-purple: #7c3aed;
  }

  .light-mode {
    --scalar-background-1: #ffffff;
    --scalar-background-2: #f8fafc;
    --scalar-background-3: #e2e8f0;
    --scalar-color-1: #0f172a;
    --scalar-color-2: #475569;
    --scalar-color-3: #64748b;
    --scalar-border-color: rgba(15, 23, 42, 0.12);
    --scalar-sidebar-background-1: #f8fafc;
    --scalar-sidebar-border-color: rgba(15, 23, 42, 0.12);
  }

  .dark-mode {
    --scalar-background-1: #0b1020;
    --scalar-background-2: #111827;
    --scalar-background-3: #1f2937;
    --scalar-color-1: #f8fafc;
    --scalar-color-2: #cbd5e1;
    --scalar-color-3: #94a3b8;
    --scalar-border-color: rgba(226, 232, 240, 0.16);
    --scalar-sidebar-background-1: #0b1020;
    --scalar-sidebar-border-color: rgba(226, 232, 240, 0.16);
  }

  .light-mode .t-doc__sidebar,
  .dark-mode .t-doc__sidebar {
    --scalar-sidebar-item-hover-background: var(--scalar-background-2);
    --scalar-sidebar-item-active-background: var(--scalar-background-3);
    --scalar-sidebar-color-active: var(--scalar-color-1);
  }
`;

export const scalarReferenceConfig: NestJSReferenceConfiguration = {
  url: OPENAPI_JSON_PATH,
  title: `${config.appName} API Reference`,
  slug: 'bedders-api',
  pageTitle: `${config.appName} API Reference`,
  theme: 'kepler',
  layout: 'modern',
  darkMode: false,
  forceDarkModeState: 'light',
  hideDarkModeToggle: false,
  hideClientButton: false,
  hideTestRequestButton: false,
  hideSearch: false,
  isEditable: false,
  persistAuth: true,
  showSidebar: true,
  showDeveloperTools: 'localhost',
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
  expandAllModelSections: false,
  expandAllResponses: false,
  expandAllSchemaProperties: false,
  tagsSorter: 'alpha',
  operationsSorter: 'method',
  orderSchemaPropertiesBy: 'preserve',
  orderRequiredPropertiesFirst: true,
  authentication: {
    preferredSecurityScheme: 'access-token',
    createAnySecurityScheme: false,
  },
  metaData: {
    title: `${config.appName} API Reference`,
    description: `${config.appName} production OpenAPI reference for backend integration and QA.`,
    ogTitle: `${config.appName} API Reference`,
    ogDescription: `${config.appName} production OpenAPI reference for backend integration and QA.`,
  },
  customCss: scalarCustomCss,
  telemetry: false,
};
