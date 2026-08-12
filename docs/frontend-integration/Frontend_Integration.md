# Frontend API integration guide

This directory is the AI-agent-friendly source of truth for frontend API integration. It is derived from the NestJS controllers and `AuthGuard`, not from assumptions in the UI.

## Read this first

- Base URL: `{API_URL}/api/v1`.
- Protected endpoints require `Authorization: Bearer <accessToken>`.
- A route marked **Public** has no `AuthGuard`. It is callable without a bearer token.
- `Any authenticated role` means: `admin`, `care_company`, `agency`, `carer`, `supplier`, `service_provider`, or `family`.
- Roles are exact strings. Do not rename them in frontend role checks.
- A valid token for a non-`active` account is rejected with `403`.
- Standard successful responses are normally wrapped as `{ statusCode, success, message, meta, data }`; errors use `{ success: false, statusCode, message, errorSources }`.
- DTO source files are next to each controller in `src/app/module/<module>/dto/`. Use those decorators as the authoritative field-validation definition when creating request types.

## Files

- [Authentication and accounts](01-auth-and-accounts.md)
- [Profiles, directory, and catalog](02-profiles-and-catalog.md)
- [Jobs, applications, marketplace, and advertisements](03-jobs-marketplace-and-advertisements.md)
- [Operations, billing, and admin](04-operations-billing-and-admin.md)

## Important implementation notes

`POST /auth/login` establishes the session; persist/use the returned access token only according to the frontend's security model. The backend reads the token from the `Authorization` header, while cookie parsing is also enabled.

The controller currently uses `AuthGuard('admin', 'user')` for `GET|PUT /user/profile`, but `user` is not one of the seven declared `USER_ROLES`. Treat this as a backend inconsistency: the endpoint effectively works for `admin` tokens only unless the role list is changed.

Routes whose access is marked **Public** are deliberately documented as implemented. If a public write endpoint should require authentication, change the backend guard before relying on a frontend-only restriction.
