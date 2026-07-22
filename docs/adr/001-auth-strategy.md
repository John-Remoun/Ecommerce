# ADR 001: Authentication Strategy

## Status

Accepted

## Context

The API needs stateless authentication for mobile/web clients with session refresh and logout support.

## Decision

Use JWT access tokens (short-lived) + refresh tokens (long-lived, hashed and stored on the User document). Passport JWT strategy validates access tokens on protected routes.

## Consequences

- Stateless access token validation scales horizontally
- Refresh token rotation requires DB lookup
- `changeCredentialsTime` invalidates tokens on password change
