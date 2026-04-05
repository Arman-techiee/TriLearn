# Deployment Notes

## Production checklist

- Set `NODE_ENV=production`
- Provide a production `DATABASE_URL`
- Run `npm run prisma:migrate:deploy` before starting the app
- Expose `GET /health` for container and platform health checks
- Configure `FRONTEND_URL` with the exact deployed frontend origin
- Set upload storage env vars explicitly if you keep local-disk uploads

## Database migrations

Use the following commands:

```bash
npm run prisma:migrate:deploy
npm run prisma:generate
```

Do not use `prisma migrate dev` in production.

## Connection pooling

The backend supports pg pool tuning with:

```env
PGPOOL_MAX=10
PGPOOL_MIN=0
PGPOOL_IDLE_TIMEOUT_MS=10000
PGPOOL_CONNECTION_TIMEOUT_MS=10000
PGPOOL_MAX_USES=0
```

You can also add connection parameters directly to `DATABASE_URL`, for example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/edunexus?connection_limit=10&pool_timeout=20
```

## Health checks

- `GET /ping` for a simple liveness probe
- `GET /health` for a database-backed readiness probe

## Docker

The backend includes [backend/Dockerfile](backend/Dockerfile) for containerized deployment.

Example:

```bash
docker build -t edunexus-backend ./backend
docker run --env-file backend/.env -p 5000:5000 edunexus-backend
```

## File storage

This repo now supports configurable upload paths and public URLs:

```env
UPLOAD_DIR=/app/uploads
UPLOAD_PUBLIC_PATH=/uploads
UPLOAD_BASE_URL=
```

Important:

Local-disk uploads are still not suitable for stateless production platforms like Railway, Render, or Heroku-style ephemeral filesystems.

Before serious production deployment, move uploads to object storage such as:

- Amazon S3
- Cloudflare R2
- Supabase Storage
- Cloudinary

The current abstraction improves configuration, but it is not a full S3 integration yet.
