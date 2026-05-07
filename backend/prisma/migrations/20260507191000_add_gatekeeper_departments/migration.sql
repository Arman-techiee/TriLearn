-- Add department-scoped gatekeeper profiles so coordinators can only create/manage
-- gatekeepers within their own department.
CREATE TABLE "Gatekeeper" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "department" TEXT,

    CONSTRAINT "Gatekeeper_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Gatekeeper" ("id", "userId", "department")
SELECT gen_random_uuid()::text, "id", NULL
FROM "User"
WHERE "role" = 'GATEKEEPER'
  AND NOT EXISTS (
    SELECT 1
    FROM "Gatekeeper"
    WHERE "Gatekeeper"."userId" = "User"."id"
  );

CREATE UNIQUE INDEX "Gatekeeper_userId_key" ON "Gatekeeper"("userId");
CREATE INDEX "Gatekeeper_department_idx" ON "Gatekeeper"("department");

ALTER TABLE "Gatekeeper"
ADD CONSTRAINT "Gatekeeper_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Gatekeeper"
ADD CONSTRAINT "Gatekeeper_department_fkey"
FOREIGN KEY ("department") REFERENCES "Department"("name") ON DELETE SET NULL ON UPDATE CASCADE;
