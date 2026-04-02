-- AlterTable
ALTER TABLE "Routine"
ADD COLUMN "department" TEXT,
ADD COLUMN "semester" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "section" TEXT;

-- Backfill semester and department from linked subjects
UPDATE "Routine" r
SET
  "semester" = s."semester",
  "department" = s."department"
FROM "Subject" s
WHERE s."id" = r."subjectId";

-- CreateIndex
CREATE INDEX "Routine_department_semester_section_dayOfWeek_idx"
ON "Routine"("department", "semester", "section", "dayOfWeek");
