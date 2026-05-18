-- Add routine class type and student-facing notes.
CREATE TYPE "RoutineClassType" AS ENUM ('LECTURE', 'TUTORIAL', 'WORKSHOP');

ALTER TABLE "Routine"
ADD COLUMN "classType" "RoutineClassType" NOT NULL DEFAULT 'LECTURE',
ADD COLUMN "note" TEXT;
