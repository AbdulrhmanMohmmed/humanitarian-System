# HIAOS API Documentation

## Base URL
```
Production: https://api.hiaos.org/api/v1
Development: http://localhost:8000/api/v1
Backward Compat: http://localhost:8000/api
```

## Authentication

### Login
```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=YourPassword123
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### MFA Setup (TOTP)
```http
POST /api/v1/mfa/setup
Authorization: Bearer <access_token>
```

### API Key Authentication
```http
POST /api/v1/security/api-keys
Authorization: Bearer <access_token>

{"name": "My Integration", "scopes": "read,write"}
```

## Core Modules

### Beneficiaries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/beneficiaries/` | List (paginated) |
| POST | `/beneficiaries/` | Create |
| GET | `/beneficiaries/{id}` | Get by ID |
| PUT | `/beneficiaries/{id}` | Update |
| DELETE | `/beneficiaries/{id}` | Soft delete |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/` | List (paginated) |
| POST | `/projects/` | Create |
| GET | `/projects/{id}` | Get by ID |

### Finance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/grants/` | List grants |
| POST | `/grants/` | Create grant |
| GET | `/finance/transactions` | List transactions |
| POST | `/finance/transactions` | Create transaction |

### Accounting (Double-Entry)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/accounting/accounts/seed` | Seed Chart of Accounts |
| GET | `/accounting/accounts` | List accounts |
| POST | `/accounting/journal-entries` | Create journal entry |
| GET | `/accounting/trial-balance` | Trial balance |

## Humanitarian Modules

### Protection
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/protection/cases` | Create case |
| GET | `/protection/cases` | List cases |
| POST | `/protection/referrals` | Create referral |

### Nutrition
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nutrition/screenings` | Create screening (auto SAM/MAM classification) |
| GET | `/nutrition/dashboard` | Nutrition dashboard |

### WASH
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/wash/water-points` | Add water point |
| POST | `/wash/water-tests` | Submit water quality test |
| GET | `/wash/dashboard` | WASH dashboard |

### Emergency Response
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/emergency/` | Activate emergency |
| POST | `/emergency/assessments` | Rapid assessment |

### Early Warning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/early-warning/indicators` | Create indicator |
| PUT | `/early-warning/indicators/{id}/value` | Update (auto-alerts) |

## Bulk Operations
```http
POST /api/v1/bulk/import/beneficiaries
Content-Type: multipart/form-data

file=@beneficiaries.csv
```

```http
GET /api/v1/bulk/export/beneficiaries?format=csv
```

## Search
```http
GET /api/v1/search/?q=Ahmed&entity=all
```

## Pagination
All list endpoints support:
- `page` (default: 1)
- `page_size` (default: 25, max: 100)

Response format:
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "page_size": 25,
  "pages": 6
}
```

## Internationalization
Supported languages: Arabic (ar), English (en), French (fr)

## OpenAPI Docs
- Swagger UI: `/docs`
- ReDoc: `/redoc`
