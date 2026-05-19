# ADR 0003: Mobile Client Shared Secret

## Status

Accepted, with known rotation risk

## Context

Native mobile requests can be exempted from browser CSRF checks when they include signed mobile client identity headers. The current signing key is `MOBILE_CLIENT_SHARED_SECRET`, which is compiled into the mobile app and configured on the backend.

This secret identifies app builds, not individual users or individual device installs.

## Decision

Use one shared HMAC secret for mobile client identity signing in the current mobile app generation.

The backend accepts signatures for the current 30-second window and the previous window to tolerate minor clock skew.

## Consequences

Rotating `MOBILE_CLIENT_SHARED_SECRET` requires coordination between backend deployment and mobile app rollout. Existing installed apps that only know the old secret will lose the CSRF exemption after the backend stops accepting it.

For emergency rotation, the practical mitigation is to raise `MIN_MOBILE_VERSION`, release a new mobile build with the new secret, and communicate the forced upgrade path.

A future improvement is dual-secret validation with key identifiers or a versioned secret window so old and new app builds can overlap during rotation.
