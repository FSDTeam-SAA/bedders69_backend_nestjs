# Jobs, applications, marketplace, and advertisements

All paths include the `/api/v1` prefix. Roles use the exact values checked by the backend.

## Jobs and job applications

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/jobs/create-job` | `care_company`, `agency`, `supplier`, `service_provider` | Create a job. |
| PATCH | `/jobs/update-job/:id` | `care_company`, `agency`, `supplier`, `service_provider` | Update a job. |
| PATCH | `/jobs/publish-job/:id` | `care_company`, `agency`, `supplier`, `service_provider` | Publish a job. |
| PATCH | `/jobs/close-job/:id` | `care_company`, `agency`, `supplier`, `service_provider` | Close a job. |
| GET | `/jobs/get-my-jobs` | `care_company`, `agency`, `supplier`, `service_provider` | List current organisation's jobs. |
| GET | `/jobs/search-jobs` | Public | Search jobs. |
| GET | `/jobs/get-job/:id` | Public | Get job detail. |
| GET | `/jobs/admin/get-jobs` | `admin` | List jobs for administration. |
| POST | `/jobs/admin/approve-job` | `admin` | Approve a job. |
| POST | `/jobs/admin/reject-job` | `admin` | Reject a job. |
| POST | `/job-applications/apply-to-job/:jobId` | `carer` | Apply to a job. |
| GET | `/job-applications/get-my-applications` | `carer` | List own applications. |
| PATCH | `/job-applications/withdraw-application/:id` | `carer` | Withdraw own application. |
| GET | `/job-applications/get-job-applications/:jobId` | `care_company`, `agency`, `supplier`, `service_provider` | List applications for a job. |
| GET | `/job-applications/get-application-detail/:id` | `care_company`, `agency`, `supplier`, `service_provider` | Get application detail. |
| PATCH | `/job-applications/update-application-status/:id` | `care_company`, `agency`, `supplier`, `service_provider` | Change application status. |
| GET | `/job-applications/admin/get-applications` | `admin` | List applications for administration. |

## Marketplace

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/marketplace/create-marketplace-listing` | `supplier`, `service_provider` | Create listing. |
| PATCH | `/marketplace/update-marketplace-listing/:id` | `supplier`, `service_provider` | Update listing. |
| DELETE | `/marketplace/delete-marketplace-listing/:id` | `supplier`, `service_provider` | Delete listing. |
| PATCH | `/marketplace/submit-marketplace-listing/:id` | `supplier`, `service_provider` | Submit listing for review. |
| GET | `/marketplace/get-my-marketplace-listings` | `supplier`, `service_provider` | List own listings. |
| GET | `/marketplace/search-marketplace-listings` | Public | Search approved listings. |
| GET | `/marketplace/get-marketplace-listing/:id` | Public | Get listing detail. |
| POST | `/marketplace/create-marketplace-inquiry/:listingId` | Public | Submit an inquiry for a listing. |
| GET | `/marketplace/admin/get-marketplace-listings` | `admin` | List marketplace listings for review. |
| POST | `/marketplace/admin/approve-marketplace-listing` | `admin` | Approve listing. |
| POST | `/marketplace/admin/reject-marketplace-listing` | `admin` | Reject listing. |

## Advertisements

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/advertisements/create-advertisement` | `care_company`, `agency`, `supplier`, `service_provider` | Create advertisement. |
| POST | `/advertisements/upload-advertisement-asset/:id` | `care_company`, `agency`, `supplier`, `service_provider` | Upload advertisement asset; use the controller's multipart field. |
| PATCH | `/advertisements/update-advertisement/:id` | `care_company`, `agency`, `supplier`, `service_provider` | Update advertisement. |
| GET | `/advertisements/get-my-advertisements` | `care_company`, `agency`, `supplier`, `service_provider` | List own advertisements. |
| GET | `/advertisements/serve-advertisements` | Public | Fetch advertisements to display. |
| POST | `/advertisements/track-advertisement-impression/:id` | Public | Record impression. |
| POST | `/advertisements/track-advertisement-click/:id` | Public | Record click. |
| GET | `/advertisements/admin/get-advertisements` | `admin` | List advertisements for review. |
| POST | `/advertisements/admin/approve-advertisement` | `admin` | Approve advertisement. |
| POST | `/advertisements/admin/reject-advertisement` | `admin` | Reject advertisement. |

Request DTOs: `job`, `job-application`, `marketplace`, and `advertisement` module `dto/` directories.
