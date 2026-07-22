# Ecommerce Backend

A NestJS-based ecommerce backend for user authentication, product management, orders, and related commerce workflows.

## Purpose

This project provides a REST API foundation for managing users, products, categories, brands, and orders, with authentication and secure token handling.

## Prerequisites

- Node.js 18+
- npm
- MongoDB instance
- Redis instance (for configured services)
- A `.env` file based on the values in `.env.example`

## Installation

```bash
npm install
cp .env.example .env
```

## Environment Variables

Use the variables listed in `.env.example` and adjust them for your local or deployment environment.

Key values include:

- `DB_URI` for MongoDB
- `ENC_KEY` for AES-256 encryption
- `User_TOKEN_SECRET_KEY`, `System_TOKEN_SECRET_KEY`, `User_REFRESH_TOKEN_SECRET_KEY`, and `System_REFRESH_TOKEN_SECRET_KEY` for JWT signing
- `EMAIL_APP` and `EMAIL_APP_PASSWORD` for outbound mail
- `ORIGINS` for allowed frontend origins

## Run the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production
npm run start:prod
```

## Run tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

## Lint and type-check

```bash
npx tsc --noEmit
npx eslint
```

## Project Roadmap

This repository follows the development plan documented in [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md).
