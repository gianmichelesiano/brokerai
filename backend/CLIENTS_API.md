# Clients API Documentation

## Overview

The Clients API provides endpoints for managing client data in the broker system. Clients can be either individuals or companies, each with their own specific profile data.

## Base URL

```
/api/v1/clients
```

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Data Models

### Client Types

- `individual`: Individual clients with personal information
- `company`: Company clients with business information

### Individual Profile Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `first_name` | string | Yes | First name of the individual |
| `last_name` | string | Yes | Last name of the individual |
| `birth_date` | datetime | No | Birth date of the individual |
| `fiscal_code` | string | Yes | Italian fiscal code (16 characters) |
| `phone` | string | No | Phone number |
| `email` | string | No | Email address |
| `address` | string | No | Address |
| `city` | string | No | City |
| `postal_code` | string | No | Postal code |
| `province` | string | No | Province |

### Company Profile Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `company_name` | string | Yes | Company name |
| `vat_number` | string | Yes | VAT number (11-20 characters) |
| `fiscal_code` | string | No | Italian fiscal code (16 characters) |
| `legal_address` | string | Yes | Legal address |
| `city` | string | Yes | City |
| `postal_code` | string | Yes | Postal code |
| `province` | string | Yes | Province (2 letters) |
| `phone` | string | No | Company phone number |
| `email` | string | No | Company email address |
| `contact_person` | string | No | Contact person name |
| `contact_phone` | string | No | Contact person phone |
| `contact_email` | string | No | Contact person email |

## Endpoints

### 1. Create Client

**POST** `/api/v1/clients`

Creates a new client with the appropriate profile (individual or company) in a transactional manner.

#### Request Body

```json
{
  "client_type": "individual",
  "is_active": true,
  "notes": "Optional notes about the client",
  "individual_profile": {
    "first_name": "Mario",
    "last_name": "Rossi",
    "birth_date": "1980-01-15T00:00:00Z",
    "fiscal_code": "RSSMRA80A15H501U",
    "phone": "+39 123 456 7890",
    "email": "mario.rossi@email.com",
    "address": "Via Roma 123",
    "city": "Milano",
    "postal_code": "20100",
    "province": "MI"
  }
}
```

Or for a company:

```json
{
  "client_type": "company",
  "is_active": true,
  "notes": "Optional notes about the client",
  "company_profile": {
    "company_name": "Azienda SRL",
    "vat_number": "12345678901",
    "fiscal_code": "1234567890123456",
    "legal_address": "Via delle Aziende 456",
    "city": "Roma",
    "postal_code": "00100",
    "province": "RM",
    "phone": "+39 06 123 4567",
    "email": "info@azienda.it",
    "contact_person": "Giuseppe Verdi",
    "contact_phone": "+39 333 123 4567",
    "contact_email": "g.verdi@azienda.it"
  }
}
```

#### Response

```json
{
  "success": true,
  "message": "Cliente creato con successo",
  "client": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "broker_id": "550e8400-e29b-41d4-a716-446655440001",
    "client_type": "individual",
    "is_active": true,
    "notes": "Optional notes about the client",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "individual_profile": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "first_name": "Mario",
      "last_name": "Rossi",
      "birth_date": "1980-01-15T00:00:00Z",
      "fiscal_code": "RSSMRA80A15H501U",
      "phone": "+39 123 456 7890",
      "email": "mario.rossi@email.com",
      "address": "Via Roma 123",
      "city": "Milano",
      "postal_code": "20100",
      "province": "MI",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    "company_profile": null
  }
}
```

#### Error Responses

- `400 Bad Request`: Invalid data or missing required fields
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error

### 2. Get All Clients

**GET** `/api/v1/clients`

Returns a paginated list of clients managed by the authenticated broker.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 100 | Number of clients to return (1-1000) |
| `offset` | integer | 0 | Number of clients to skip |

#### Response

```json
{
  "success": true,
  "message": "Trovati 2 clienti",
  "clients": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "broker_id": "550e8400-e29b-41d4-a716-446655440001",
      "client_type": "individual",
      "is_active": true,
      "notes": "Cliente individuale",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "individual_profile": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "first_name": "Mario",
        "last_name": "Rossi",
        "birth_date": "1980-01-15T00:00:00Z",
        "fiscal_code": "RSSMRA80A15H501U",
        "phone": "+39 123 456 7890",
        "email": "mario.rossi@email.com",
        "address": "Via Roma 123",
        "city": "Milano",
        "postal_code": "20100",
        "province": "MI",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      },
      "company_profile": null
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "broker_id": "550e8400-e29b-41d4-a716-446655440001",
      "client_type": "company",
      "is_active": true,
      "notes": "Cliente aziendale",
      "created_at": "2024-01-15T11:00:00Z",
      "updated_at": "2024-01-15T11:00:00Z",
      "individual_profile": null,
      "company_profile": {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "company_name": "Azienda SRL",
        "vat_number": "12345678901",
        "fiscal_code": "1234567890123456",
        "legal_address": "Via delle Aziende 456",
        "city": "Roma",
        "postal_code": "00100",
        "province": "RM",
        "phone": "+39 06 123 4567",
        "email": "info@azienda.it",
        "contact_person": "Giuseppe Verdi",
        "contact_phone": "+39 333 123 4567",
        "contact_email": "g.verdi@azienda.it",
        "created_at": "2024-01-15T11:00:00Z",
        "updated_at": "2024-01-15T11:00:00Z"
      }
    }
  ],
  "total": 2,
  "limit": 100,
  "offset": 0
}
```

### 3. Get Client by ID

**GET** `/api/v1/clients/{client_id}`

Returns a specific client with the associated profile data.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `client_id` | UUID | The ID of the client to retrieve |

#### Response

```json
{
  "success": true,
  "message": "Cliente trovato con successo",
  "client": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "broker_id": "550e8400-e29b-41d4-a716-446655440001",
    "client_type": "individual",
    "is_active": true,
    "notes": "Cliente individuale",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "individual_profile": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "first_name": "Mario",
      "last_name": "Rossi",
      "birth_date": "1980-01-15T00:00:00Z",
      "fiscal_code": "RSSMRA80A15H501U",
      "phone": "+39 123 456 7890",
      "email": "mario.rossi@email.com",
      "address": "Via Roma 123",
      "city": "Milano",
      "postal_code": "20100",
      "province": "MI",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    "company_profile": null
  }
}
```

#### Error Responses

- `403 Forbidden`: Client does not belong to the authenticated broker
- `404 Not Found`: Client not found
- `401 Unauthorized`: Missing or invalid authentication token

### 4. Update Client

**PUT** `/api/v1/clients/{client_id}`

Updates the client data and/or the associated profile.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `client_id` | UUID | The ID of the client to update |

#### Request Body

```json
{
  "is_active": false,
  "notes": "Updated notes about the client",
  "individual_profile": {
    "phone": "+39 987 654 3210",
    "email": "mario.rossi.new@email.com"
  }
}
```

#### Response

```json
{
  "success": true,
  "message": "Cliente aggiornato con successo",
  "client": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "broker_id": "550e8400-e29b-41d4-a716-446655440001",
    "client_type": "individual",
    "is_active": false,
    "notes": "Updated notes about the client",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T12:00:00Z",
    "individual_profile": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "first_name": "Mario",
      "last_name": "Rossi",
      "birth_date": "1980-01-15T00:00:00Z",
      "fiscal_code": "RSSMRA80A15H501U",
      "phone": "+39 987 654 3210",
      "email": "mario.rossi.new@email.com",
      "address": "Via Roma 123",
      "city": "Milano",
      "postal_code": "20100",
      "province": "MI",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T12:00:00Z"
    },
    "company_profile": null
  }
}
```

### 5. Delete Client

**DELETE** `/api/v1/clients/{client_id}`

Deletes the client and the associated profile (individual or company).

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `client_id` | UUID | The ID of the client to delete |

#### Response

```json
{
  "success": true,
  "message": "Cliente eliminato con successo"
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

Common HTTP status codes:

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Security

- All endpoints require authentication
- Brokers can only access their own clients
- Row Level Security (RLS) is enforced at the database level
- Input validation is performed on all fields

## Database Schema

The system uses three main tables:

1. **clients**: Main client records
2. **individual_profiles**: Individual client details
3. **company_profiles**: Company client details

The relationship is enforced through foreign keys and constraints to ensure data integrity.

## Transactional Operations

The client creation process is transactional:

1. Create the appropriate profile (individual or company)
2. Create the client record with reference to the profile
3. If any step fails, the entire operation is rolled back

This ensures data consistency and prevents orphaned records. 