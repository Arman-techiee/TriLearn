# ADR 0002: Notification Delivery

## Status

Accepted

## Context

Notification work includes database writes, Socket.IO emission, optional mobile push delivery, notice fan-out, routine-change fan-out, password-reset email, and bulk import status work. Some of these operations are user-visible side effects and some depend on Redis or external providers.

Direct in-request delivery made failures harder to retry and encouraged fire-and-forget calls that could hide errors.

## Decision

Use BullMQ as the preferred execution path for notification and notification-adjacent background jobs when Redis is configured.

Queue submission is awaited by request handlers and services so enqueue failures surface immediately. Worker failures are logged, captured by monitoring, and retried through BullMQ job options.

When Redis is not configured, notification helpers keep an inline fallback for development and test environments. Inline fallback work is awaited by the caller.

## Consequences

Production deployments should run Redis and a notification worker. The worker may run in the API process for simple deployments or as a dedicated `NODE_ROLE=worker` process for scaled deployments.

Side effects in the worker should be idempotent or use dedupe keys because BullMQ retries can re-run jobs after transient failures.

New notification producers should either enqueue a BullMQ job or await the notification helper fallback. They should not launch unobserved promises with swallowed errors.
