# Operations, billing, and admin

All paths include the `/api/v1` prefix.

## Packages, plans, and coupons

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/packages/get-packages` | Public | List available packages. |
| GET | `/packages/get-package/:id` | Public | Get package detail. |
| GET | `/packages/get-all-packages` | `admin` | List all packages, including admin-visible items. |
| POST | `/packages/admin/create-package` | `admin` | Create package. |
| PATCH | `/packages/admin/update-package/:id` | `admin` | Update package. |
| PATCH | `/packages/admin/disable-package/:id` | `admin` | Disable package. |
| GET | `/membership-plans` | Public | List membership plans. |
| POST | `/membership-plans` | `admin` | Create membership plan. |
| PATCH | `/membership-plans/:id` | `admin` | Update membership plan. |
| DELETE | `/membership-plans/:id` | `admin` | Delete membership plan. |
| GET | `/coupons` | Public | List coupons. |
| POST | `/coupons` | `admin` | Create coupon. |
| PATCH | `/coupons/:id` | `admin` | Update coupon. |
| DELETE | `/coupons/:id` | `admin` | Delete coupon. |

## Payments and Stripe webhook

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/payment/:subscribeId` | `admin`, `care_company`, `agency`, `carer`, `supplier`, `service_provider`, `family` | Start a subscription payment. |
| POST | `/payment/create-package-checkout/:packageId` | `care_company`, `agency`, `supplier`, `service_provider`, `family`, `carer` | Start a package checkout. |
| GET | `/payment` | `admin` | List payments. |
| GET | `/payment/:id` | `admin` | Get payment detail. |
| POST | `/webhook` | External Stripe webhook | Stripe callback. Do not call this from the browser; it expects Stripe's raw signed request. |

## Contact and subscriptions

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/contact` | Public | Submit contact message. |
| GET | `/contact` | `admin` | List contact messages. |
| GET | `/contact/:id` | Public | Get contact message. |
| PUT | `/contact/:id` | `admin` | Update contact message. |
| DELETE | `/contact/:id` | `admin` | Delete contact message. |
| POST | `/subscribe` | `admin` | Create subscription entry. |
| GET | `/subscribe` | Public | List subscriptions. |
| GET | `/subscribe/:id` | Public | Get subscription entry. |
| PATCH | `/subscribe/:id` | `admin` | Update subscription entry. |
| DELETE | `/subscribe/:id` | `admin` | Delete subscription entry. |

## Admin dashboard and audit logs

Every endpoint in this table requires the exact role `admin`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard/overview` | Dashboard overview metrics. |
| GET | `/dashboard/chart` | Dashboard chart data. |
| GET | `/dashboard/users` | User dashboard data. |
| GET | `/dashboard/approvals` | Approval dashboard data. |
| GET | `/dashboard/jobs` | Job dashboard data. |
| GET | `/dashboard/marketplace` | Marketplace dashboard data. |
| GET | `/dashboard/revenues` | Revenue dashboard data. |
| POST | `/dashboard/coupons` | Create dashboard coupon. |
| GET | `/dashboard/coupons` | List dashboard coupons. |
| GET | `/dashboard/mvp-reports` | MVP reports. |
| GET | `/admin/notifications/get-notification-logs` | Notification audit logs. |

Request DTOs: `package`, `membership-plan`, `coupon`, `subscribe`, `contact`, and `dashboard` module `dto/` directories.
