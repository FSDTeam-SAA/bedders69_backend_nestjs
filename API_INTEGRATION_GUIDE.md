# API Integration Guide

This guide is designed for frontend developers and AI coding agents (Codex, Claude, Cursor, etc.) to quickly integrate the Bedders Backend API into websites and dashboards.

## 1. System Overview & Setup
- **Base URL**: `/api/v1`
- **Environment Setup**: All requests must prefix the Base URL. For example, local development usually points to `http://localhost:5000/api/v1`.
- **Swagger UI**: Full request/response schemas can be explored by visiting `/api/docs`.

## 2. Standard API Contracts

All endpoints return data in a standard wrapper to make parsing predictable.

### Success Response Schema
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Request successfully completed",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50
  },
  "data": { ... } // Your requested resource(s) here
}
```

### Error Response Schema
Your frontend interceptor should capture `4xx` and `5xx` errors globally and look for this structure:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errorSources": [
    {
      "path": "email",
      "message": "Valid email is required"
    }
  ],
  "stack": null
}
```

### Pagination, Search & Filtering
Standard query parameters for list endpoints (`GET` requests):
- `page`: Page number (e.g., `1`)
- `limit`: Items per page (e.g., `10`)
- `sortBy`: Field to sort by (e.g., `createdAt`)
- `sortOrder`: Direction (`asc` or `desc`)
- `searchTerm`: Text search across configured string fields (e.g., `john`)

---

## 3. Authentication Flow
- **Headers**: Protected routes require the JWT Access Token in the Authorization header.
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
- **Login Flow**: Call `POST /api/v1/auth/login`. Extract the `accessToken` from the response `data` and store it (e.g., in localStorage or cookies).
- **Refresh Flow**: Call `POST /api/v1/auth/refresh-token` to get a new access token when the old one expires.
- **Roles**: Routes may be protected by `admin`, `user`, or specific entity roles. The backend will return a `403 Forbidden` if the role is insufficient.

---

## 4. Complete Endpoints Cheatsheet (Grouped by Module with Roles)

Below is the exhaustive list of all API endpoints available in the system along with their required authorization roles. **Do not hallucinate endpoints outside of this list.**

*(Note: `Public` means no token is required. Any other role requires a valid Bearer token and the user must belong to that specific role).*

### ADVERTISEMENT
- **POST** `/api/v1/advertisements/create-advertisement` *(Role: Public)*
- **POST** `/api/v1/advertisements/upload-advertisement-asset/:id` *(Role: Public)*
- **PATCH** `/api/v1/advertisements/update-advertisement/:id` *(Role: Public)*
- **GET** `/api/v1/advertisements/get-my-advertisements` *(Role: Public)*
- **GET** `/api/v1/advertisements/serve-advertisements` *(Role: Public)*
- **POST** `/api/v1/advertisements/track-advertisement-impression/:id` *(Role: Public)*
- **POST** `/api/v1/advertisements/track-advertisement-click/:id` *(Role: Public)*
- **GET** `/api/v1/advertisements/admin/get-advertisements` *(Role: Public)*
- **POST** `/api/v1/advertisements/admin/approve-advertisement` *(Role: Public)*
- **POST** `/api/v1/advertisements/admin/reject-advertisement` *(Role: Public)*

### AGENCY
- **POST** `/api/v1/agency` *(Role: Public)*
- **GET** `/api/v1/agency/get-my-profile` *(Role: agency)*
- **PATCH** `/api/v1/agency/update-my-profile` *(Role: agency)*

### AUTH
- **POST** `/api/v1/auth/register` *(Role: Public)*
- **POST** `/api/v1/auth/login` *(Role: Public)*
- **POST** `/api/v1/auth/forgot-password` *(Role: Public)*
- **POST** `/api/v1/auth/verify` *(Role: Public)*
- **POST** `/api/v1/auth/reset-password` *(Role: Public)*
- **POST** `/api/v1/auth/change-password` *(Role: Public)*
- **POST** `/api/v1/auth/refresh-token` *(Role: Public)*
- **POST** `/api/v1/auth/logout` *(Role: Public)*

### CARE
- **POST** `/api/v1/care` *(Role: Public)*
- **GET** `/api/v1/care/get-my-profile` *(Role: care_company)*
- **PATCH** `/api/v1/care/update-my-profile` *(Role: care_company)*

### COMPANY
- **POST** `/api/v1/company` *(Role: Public)*
- **GET** `/api/v1/company/get-my-profile` *(Role: company)*
- **PATCH** `/api/v1/company/update-my-profile` *(Role: company)*

### CONTACT
- **POST** `/api/v1/contact` *(Role: Public)*
- **GET** `/api/v1/contact` *(Role: admin)*
- **GET** `/api/v1/contact/:id` *(Role: Public)*
- **PUT** `/api/v1/contact/:id` *(Role: admin)*
- **DELETE** `/api/v1/contact/:id` *(Role: admin)*

### COUPON
- **POST** `/api/v1/coupons` *(Role: admin)*
- **GET** `/api/v1/coupons` *(Role: admin)*
- **PATCH** `/api/v1/coupons/:id` *(Role: admin)*
- **DELETE** `/api/v1/coupons/:id` *(Role: admin)*

### DASHBOARD
- **GET** `/api/v1/dashboard/overview` *(Role: admin)*
- **GET** `/api/v1/dashboard/chart` *(Role: admin)*
- **GET** `/api/v1/dashboard/users` *(Role: admin)*
- **GET** `/api/v1/dashboard/approvals` *(Role: admin)*
- **GET** `/api/v1/dashboard/jobs` *(Role: admin)*
- **GET** `/api/v1/dashboard/marketplace` *(Role: admin)*
- **GET** `/api/v1/dashboard/revenues` *(Role: admin)*
- **POST** `/api/v1/dashboard/coupons` *(Role: admin)*
- **GET** `/api/v1/dashboard/coupons` *(Role: admin)*
- **GET** `/api/v1/dashboard/mvp-reports` *(Role: admin)*

### ENTITLEMENT
- **GET** `/api/v1/entitlements/get-my-entitlements` *(Role: Authenticated (Any Role))*

### FAMILY
- **POST** `/api/v1/family` *(Role: Public)*
- **GET** `/api/v1/family/get-my-profile` *(Role: family)*
- **PATCH** `/api/v1/family/update-my-profile` *(Role: family)*

### JOB
- **POST** `/api/v1/jobs/create-job` *(Role: care_company, agency, supplier, service_provider)*
- **PATCH** `/api/v1/jobs/update-job/:id` *(Role: care_company, agency, supplier, service_provider)*
- **PATCH** `/api/v1/jobs/publish-job/:id` *(Role: care_company, agency, supplier, service_provider)*
- **PATCH** `/api/v1/jobs/close-job/:id` *(Role: care_company, agency, supplier, service_provider)*
- **GET** `/api/v1/jobs/get-my-jobs` *(Role: care_company, agency, supplier, service_provider)*
- **GET** `/api/v1/jobs/search-jobs` *(Role: Public)*
- **GET** `/api/v1/jobs/get-job/:id` *(Role: Public)*
- **GET** `/api/v1/jobs/admin/get-jobs` *(Role: admin)*
- **POST** `/api/v1/jobs/admin/approve-job` *(Role: admin)*
- **POST** `/api/v1/jobs/admin/reject-job` *(Role: admin)*

### JOB-APPLICATION
- **POST** `/api/v1/job-applications/apply-to-job/:jobId` *(Role: carer)*
- **GET** `/api/v1/job-applications/get-my-applications` *(Role: carer)*
- **PATCH** `/api/v1/job-applications/withdraw-application/:id` *(Role: carer)*
- **GET** `/api/v1/job-applications/get-job-applications/:jobId` *(Role: care_company, agency, supplier, service_provider)*
- **GET** `/api/v1/job-applications/get-application-detail/:id` *(Role: care_company, agency, supplier, service_provider)*
- **PATCH** `/api/v1/job-applications/update-application-status/:id` *(Role: care_company, agency, supplier, service_provider)*
- **GET** `/api/v1/job-applications/admin/get-applications` *(Role: admin)*

### MARKETPLACE
- **POST** `/api/v1/marketplace/create-marketplace-listing` *(Role: supplier, service_provider)*
- **PATCH** `/api/v1/marketplace/update-marketplace-listing/:id` *(Role: supplier, service_provider)*
- **DELETE** `/api/v1/marketplace/delete-marketplace-listing/:id` *(Role: supplier, service_provider)*
- **PATCH** `/api/v1/marketplace/submit-marketplace-listing/:id` *(Role: supplier, service_provider)*
- **GET** `/api/v1/marketplace/get-my-marketplace-listings` *(Role: supplier, service_provider)*
- **GET** `/api/v1/marketplace/search-marketplace-listings` *(Role: Public)*
- **GET** `/api/v1/marketplace/get-marketplace-listing/:id` *(Role: Public)*
- **POST** `/api/v1/marketplace/create-marketplace-inquiry/:listingId` *(Role: Public)*
- **GET** `/api/v1/marketplace/admin/get-marketplace-listings` *(Role: admin)*
- **POST** `/api/v1/marketplace/admin/approve-marketplace-listing` *(Role: admin)*
- **POST** `/api/v1/marketplace/admin/reject-marketplace-listing` *(Role: admin)*

### MEMBERSHIP-PLAN
- **POST** `/api/v1/membership-plans` *(Role: admin)*
- **GET** `/api/v1/membership-plans` *(Role: Public)*
- **PATCH** `/api/v1/membership-plans/:id` *(Role: admin)*
- **DELETE** `/api/v1/membership-plans/:id` *(Role: admin)*

### NOTIFICATION
- **GET** `/api/v1/admin/notifications/get-notification-logs` *(Role: admin)*

### PACKAGE
- **POST** `/api/v1/packages/admin/create-package` *(Role: admin)*
- **PATCH** `/api/v1/packages/admin/update-package/:id` *(Role: admin)*
- **PATCH** `/api/v1/packages/admin/disable-package/:id` *(Role: admin)*
- **GET** `/api/v1/packages/get-packages` *(Role: Public)*
- **GET** `/api/v1/packages/get-all-packages` *(Role: admin)*
- **GET** `/api/v1/packages/get-package/:id` *(Role: admin)*

### PAYMENT
- **POST** `/api/v1/payment/:subscribeId` *(Role: Authenticated (Any Role))*
- **POST** `/api/v1/payment/create-package-checkout/:packageId` *(Role: Authenticated (Any Role))*
- **GET** `/api/v1/payment` *(Role: admin)*
- **GET** `/api/v1/payment/:id` *(Role: Public)*

### PRODUCT
- **GET** `/api/v1/products` *(Role: Public)*
- **GET** `/api/v1/products/category/:categoryId` *(Role: Public)*
- **GET** `/api/v1/products/supplier/:supplierId` *(Role: Public)*
- **GET** `/api/v1/products/:id` *(Role: Public)*
- **POST** `/api/v1/products` *(Role: supplier)*
- **PATCH** `/api/v1/products/:id` *(Role: supplier)*
- **DELETE** `/api/v1/products/:id` *(Role: supplier)*

### PRODUCT-CATEGORY
- **POST** `/api/v1/product-categories` *(Role: admin)*
- **GET** `/api/v1/product-categories` *(Role: Public)*
- **GET** `/api/v1/product-categories/supplier/:supplierId` *(Role: Public)*
- **GET** `/api/v1/product-categories/:id` *(Role: Public)*
- **PATCH** `/api/v1/product-categories/:id` *(Role: admin)*
- **DELETE** `/api/v1/product-categories/:id` *(Role: admin)*

### PRODUCT-SUPPLIER
- **POST** `/api/v1/product-supplier` *(Role: Public)*
- **GET** `/api/v1/product-supplier/get-my-profile` *(Role: supplier)*
- **PATCH** `/api/v1/product-supplier/update-my-profile` *(Role: supplier)*

### PROFILE (Admin & Public Profiles)
- **GET** `/api/v1/profiles/search-care-companies` *(Role: Public)*
- **GET** `/api/v1/profiles/search-recruitment-agencies` *(Role: Public)*
- **GET** `/api/v1/profiles/search-suppliers` *(Role: Public)*
- **GET** `/api/v1/profiles/search-service-providers` *(Role: Public)*
- **GET** `/api/v1/profiles/search-restricted-carers` *(Role: care_company, agency, supplier, service_provider)*
- **POST** `/api/v1/profiles/create-recruitment-agency-profile` *(Role: Public)*
- **GET** `/api/v1/profiles/get-my-recruitment-agency-profile` *(Role: agency)*
- **PATCH** `/api/v1/profiles/update-my-recruitment-agency-profile` *(Role: agency)*
- **POST** `/api/v1/profiles/create-supplier-profile` *(Role: Public)*
- **GET** `/api/v1/profiles/get-my-supplier-profile` *(Role: supplier)*
- **PATCH** `/api/v1/profiles/update-my-supplier-profile` *(Role: supplier)*
- **POST** `/api/v1/profiles/create-service-provider-profile` *(Role: Public)*
- **GET** `/api/v1/profiles/get-my-service-provider-profile` *(Role: service_provider)*
- **PATCH** `/api/v1/profiles/update-my-service-provider-profile` *(Role: service_provider)*
- **GET** `/api/v1/profiles/admin/get-profiles` *(Role: admin)*
- **GET** `/api/v1/profiles/admin/get-profile/:userId` *(Role: admin)*
- **POST** `/api/v1/profiles/admin/approve-profile` *(Role: admin)*
- **POST** `/api/v1/profiles/admin/reject-profile` *(Role: admin)*
- **POST** `/api/v1/profiles/admin/suspend-profile` *(Role: admin)*
- **POST** `/api/v1/profiles/admin/reactivate-profile` *(Role: admin)*

### SERVICE
- **POST** `/api/v1/services` *(Role: service_provider)*
- **GET** `/api/v1/services` *(Role: Public)*
- **GET** `/api/v1/services/provider/:providerId` *(Role: Public)*
- **GET** `/api/v1/services/:id` *(Role: Public)*
- **PATCH** `/api/v1/services/:id` *(Role: service_provider)*
- **DELETE** `/api/v1/services/:id` *(Role: service_provider)*

### SERVICE-PROVIDER
- **POST** `/api/v1/service-provider` *(Role: Public)*
- **GET** `/api/v1/service-provider/get-my-profile` *(Role: service_provider)*
- **PATCH** `/api/v1/service-provider/update-my-profile` *(Role: service_provider)*

### SUBSCRIBE
- **POST** `/api/v1/subscribe` *(Role: admin)*
- **GET** `/api/v1/subscribe` *(Role: Public)*
- **GET** `/api/v1/subscribe/:id` *(Role: Public)*
- **PATCH** `/api/v1/subscribe/:id` *(Role: admin)*
- **DELETE** `/api/v1/subscribe/:id` *(Role: admin)*

### USER
- **POST** `/api/v1/user` *(Role: admin)*
- **GET** `/api/v1/user` *(Role: admin)*
- **GET** `/api/v1/user/profile` *(Role: Authenticated (Any Role))*
- **PUT** `/api/v1/user/profile` *(Role: Authenticated (Any Role))*
- **GET** `/api/v1/user/:id` *(Role: admin)*
- **PUT** `/api/v1/user/:id` *(Role: admin)*
- **DELETE** `/api/v1/user/:id` *(Role: admin)*

### WEBHOOK
- **POST** `/api/v1/webhook` *(Role: Public - Handled by Stripe)*

---

## 5. AI Agent Instructions (System Prompts)

**Dear AI Agent (Codex, Claude, etc.):**
1. **Never guess endpoints**: Only use endpoints specifically listed in this document. 
2. **Handling Responses**: The API **ALWAYS** wraps responses inside an envelope. If you make an Axios call `const res = await axios.get(...)`, the actual target data is in `res.data.data`.
3. **Pagination Parsing**: Read pagination properties (`page`, `limit`, `total`) from `res.data.meta` instead of the root body.
4. **Error Handling**: Catch `res.data.errorSources` and map these properties to the UI state (e.g., matching the `errorSources[i].path` to your form field name).
5. **Types / Interfaces**: Generate TypeScript interfaces on the frontend for these payloads based on contextual understanding, or ask the developer to export types directly from the backend DTOs.
6. **Authorization Roles**: Endpoints marked as `Public` do not need an Authorization header. Endpoints marked with a specific role (e.g., `admin`, `agency`) MUST include a valid `Bearer` token in the `Authorization` header, and the logged-in user must belong to that role, otherwise the API returns `403 Forbidden`.
