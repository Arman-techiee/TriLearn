ALTER TABLE "Instructor"
ADD COLUMN "departments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Instructor"
SET "departments" = CASE
  WHEN "department" IS NULL OR btrim("department") = '' THEN ARRAY[]::TEXT[]
  ELSE ARRAY["department"]
END;
