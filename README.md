# Physical Store API

A NestJS application for managing physical stores and their points of sale (PDVs), with geospatial search capabilities.

## Overview

The Physical Store application provides a REST API for managing physical stores and their associated points of sale. It includes features such as:

- Store management (CRUD operations)
- PDV (Point of Sale) management (CRUD operations)
- Geospatial search (find stores and PDVs by location)
- Shipping time calculation
- Distance calculation between locations

This API was made following SOLID principles, Domain-Driven Design, Clean Code and some points of Clean Architecture.

## Technology Stack

- **Framework**: NestJS
- **HTTP Provider**: Fastify
- **Database**: MongoDB (with Mongoose)
- **Documentation**: Swagger/OpenAPI
- **Environment**: Node.js

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd physical_store_v2

# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
DATABASE=<your-mongodb-connection-string-with-<PASSWORD>-placeholder>
DATABASE_PASSWORD=<your-mongodb-password>
```

## Running the Application

```bash
#Running the application
npm run start:dev

#Currently, the application has no production environment. Feel free to create one and refactor the code according to your needs

```
The API documentation is available via Swagger UI at:

http://localhost:3000/api-docs
```

## API Endpoints

### Stores

- `GET /stores` - Get all stores
- `GET /stores/:id` - Get a store by ID
- `GET /stores/by-state/:state` - Get stores by state
- `GET /stores/by-cep/:cep` - Get stores by postal code (CEP)
- `POST /stores` - Create a new store
- `PUT /stores/:id` - Update a store
- `DELETE /stores/:id` - Delete a store

### PDVs (Points of Sale)

- `GET /pdvs` - Get all PDVs
- `GET /pdvs/id/:id` - Get a PDV by ID
- `GET /pdvs/by-state/:state` - Get PDVs by state
- `GET /pdvs/by-cep/:cep` - Get PDVs by postal code (CEP)
- `POST /pdvs` - Create a new PDV
- `PUT /pdvs/id/:id` - Update a PDV
- `DELETE /pdvs/id/:id` - Delete a PDV

## Data Models

### Store

- `storeName`: String (required, unique)
- `takeOutInStore`: Boolean
- `shippingTimeInDays`: Number
- `latitude`: Number
- `longitude`: Number
- `address`: String
- `city`: String
- `district`: String
- `state`: String
- `type`: String (default: 'LOJA')
- `country`: String
- `postalCode`: String
- `telephoneNumber`: Number
- `emailAddress`: String
- `pdvs`: Array of PDV references

### PDV (Point of Sale)

- `storeName`: String (required, unique)
- `takeOutInStore`: Boolean
- `shippingTimeInDays`: Number
- `latitude`: Number
- `longitude`: Number
- `address`: String
- `city`: String
- `district`: String
- `state`: String
- `type`: String (default: 'PDV')
- `country`: String
- `postalCode`: String
- `telephoneNumber`: Number
- `emailAddress`: String
- `store`: Reference to parent Store (required)

## Geospatial Features

The application provides geospatial search capabilities, allowing you to:

1. Find stores and PDVs near a specific postal code
2. Calculate distances between locations
3. Sort results by proximity

## Example Usage

### Creating a Store

```bash
curl -X POST http://localhost:3000/stores \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "Main Store",
    "takeOutInStore": true,
    "shippingTimeInDays": 2,
    "latitude": -23.5505,
    "longitude": -46.6333,
    "address": "Avenida Paulista, 1000",
    "city": "São Paulo",
    "district": "Bela Vista",
    "state": "SP",
    "country": "Brazil",
    "postalCode": "01310-100",
    "telephoneNumber": 1123456789,
    "emailAddress": "store@example.com"
  }'
```

### Creating a PDV for a Store

```bash
curl -X POST http://localhost:3000/pdvs \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "Downtown PDV",
    "store": "60a1e2c5c5e4b02f68c15a1c",
    "takeOutInStore": true,
    "shippingTimeInDays": 3,
    "latitude": -23.5430,
    "longitude": -46.6420,
    "address": "Rua Augusta, 500",
    "city": "São Paulo",
    "district": "Consolação",
    "state": "SP",
    "country": "Brazil",
    "postalCode": "01304-000",
    "telephoneNumber": 1123456789,
    "emailAddress": "pdv@example.com"
  }'
```

### Finding Stores and PDVs Near a Postal Code

```bash
curl -X GET http://localhost:3000/stores/by-cep/01310-100
```

## Project Structure

```
src/
├── common/           # Common modules, filters, middleware
├── domains/          # Domain-specific modules
│   ├── stores/       # Store domain
│   └── pdvs/         # PDV domain
├── infrastructure/   # Infrastructure services
├── utils/            # Utility functions
├── app.module.ts     # Main application module
└── main.ts           # Application entry point
```

## Testing

Unit tests were implemented in the application. You can run them/check out their coverage with the commands below:

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov
```

