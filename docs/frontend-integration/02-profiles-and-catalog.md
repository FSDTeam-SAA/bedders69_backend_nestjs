# Profiles, directory, and catalog

All paths include the `/api/v1` prefix.

## Organisation directory and profile approval

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/profiles/search-care-companies` | Public | Search care-company profiles. |
| GET | `/profiles/search-recruitment-agencies` | Public | Search agency profiles. |
| GET | `/profiles/search-suppliers` | Public | Search supplier profiles. |
| GET | `/profiles/search-service-providers` | Public | Search service-provider profiles. |
| GET | `/profiles/search-restricted-carers` | `care_company`, `agency`, `supplier`, `service_provider` | Search carers visible only to organisations. |
| POST | `/profiles/create-recruitment-agency-profile` | Public | Create an agency organisation profile. |
| GET | `/profiles/get-my-recruitment-agency-profile` | `agency` | Read own agency profile. |
| PATCH | `/profiles/update-my-recruitment-agency-profile` | `agency` | Update own agency profile. |
| POST | `/profiles/create-supplier-profile` | Public | Create a supplier organisation profile. |
| GET | `/profiles/get-my-supplier-profile` | `supplier` | Read own supplier profile. |
| PATCH | `/profiles/update-my-supplier-profile` | `supplier` | Update own supplier profile. |
| POST | `/profiles/create-service-provider-profile` | Public | Create a service-provider organisation profile. |
| GET | `/profiles/get-my-service-provider-profile` | `service_provider` | Read own service-provider profile. |
| PATCH | `/profiles/update-my-service-provider-profile` | `service_provider` | Update own service-provider profile. |
| GET | `/profiles/admin/get-profiles` | `admin` | List profiles for review. |
| GET | `/profiles/admin/get-profile/:userId` | `admin` | Read a profile for a user. |
| POST | `/profiles/admin/approve-profile` | `admin` | Approve a profile. |
| POST | `/profiles/admin/reject-profile` | `admin` | Reject a profile. |
| POST | `/profiles/admin/suspend-profile` | `admin` | Suspend a profile. |
| POST | `/profiles/admin/reactivate-profile` | `admin` | Reactivate a profile. |

## Products and product categories

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/products` | Public | List products. |
| GET | `/products/category/:categoryId` | Public | List products in a category. |
| GET | `/products/supplier/:supplierId` | Public | List products by supplier. |
| GET | `/products/:id` | Public | Get one product. |
| POST | `/products` | `supplier` | Create product. |
| PATCH | `/products/:id` | `supplier` | Update product. |
| DELETE | `/products/:id` | `supplier` | Delete product. |
| GET | `/product-categories` | Public | List categories. |
| GET | `/product-categories/supplier/:supplierId` | Public | List a supplier's categories. |
| GET | `/product-categories/:id` | Public | Get one category. |
| POST | `/product-categories` | `supplier` | Create category. |
| PATCH | `/product-categories/:id` | `supplier` | Update category. |
| DELETE | `/product-categories/:id` | `supplier` | Delete category. |

## Services

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/services` | Public | List services. |
| GET | `/services/provider/:providerId` | Public | List a provider's services. |
| GET | `/services/:id` | Public | Get one service. |
| POST | `/services` | `service_provider` | Create service. |
| PATCH | `/services/:id` | `service_provider` | Update service. |
| DELETE | `/services/:id` | `service_provider` | Delete service. |

Request DTOs are under `profile`, `product`, `product-category`, and `service` module `dto/` directories.
