# Authentication and accounts

All paths below include the `/api/v1` prefix. **Access** is enforced by the backend.

## Authentication

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register an account; request includes a declared role. |
| POST | `/auth/login` | Public | Authenticate and receive session/token data. |
| POST | `/auth/forgot-password` | Public | Request password-reset verification. |
| POST | `/auth/verify` | Public | Verify an OTP/code. |
| POST | `/auth/reset-password` | Public | Reset the password after verification. |
| POST | `/auth/change-password` | `admin`, `care_company`, `agency`, `carer`, `supplier`, `service_provider`, `family` | Change the current user's password. |
| POST | `/auth/refresh-token` | Public | Exchange a refresh-token payload for fresh auth data. |
| POST | `/auth/logout` | Public | End the session represented by the supplied request data/cookies. |

Request DTOs: `auth/dto/create-auth.dto.ts` and `auth/dto/update-auth.dto.ts`.

## User administration and self-service

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/user` | Public | Create a user record. |
| GET | `/user` | `admin` | List users. |
| GET | `/user/profile` | `admin`, `user`* | Read current profile. |
| PUT | `/user/profile` | `admin`, `user`* | Update current profile. |
| GET | `/user/:id` | Public | Read one user by ID. |
| PUT | `/user/:id` | `admin` | Update one user by ID. |
| DELETE | `/user/:id` | `admin` | Delete one user by ID. |

\* `user` is not a declared backend role; see the directory README.

## Role-specific profile endpoints

Use these after the account exists. The create endpoint is currently public; all `get-my` and `update-my` routes enforce the role shown.

| Exact role | Create (Public) | Read own profile | Update own profile |
|---|---|---|---|
| `care_company` | `POST /company` | `GET /company/get-my-profile` | `PATCH /company/update-my-profile` |
| `agency` | `POST /agency` | `GET /agency/get-my-profile` | `PATCH /agency/update-my-profile` |
| `carer` | `POST /care` | `GET /care/get-my-profile` | `PATCH /care/update-my-profile` |
| `family` | `POST /family` | `GET /family/get-my-profile` | `PATCH /family/update-my-profile` |
| `supplier` | `POST /product-supplier` | `GET /product-supplier/get-my-profile` | `PATCH /product-supplier/update-my-profile` |
| `service_provider` | `POST /service-provider` | `GET /service-provider/get-my-profile` | `PATCH /service-provider/update-my-profile` |

Each read/update route is restricted to the role in its row. DTOs live under the corresponding module's `dto/` directory.

## Entitlements

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/entitlements/get-my-entitlements` | `care_company`, `agency`, `supplier`, `service_provider`, `family`, `carer` | Get the logged-in organisation's features/limits. |
