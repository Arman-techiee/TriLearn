ALTER TABLE "Student"
ADD COLUMN "isGraduated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "graduationYear" INTEGER,
ADD COLUMN "graduatedAt" TIMESTAMP(3);

CREATE INDEX "Student_isGraduated_idx" ON "Student"("isGraduated");
