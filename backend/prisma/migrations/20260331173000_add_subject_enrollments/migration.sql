CREATE TABLE "SubjectEnrollment" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubjectEnrollment_subjectId_studentId_key" ON "SubjectEnrollment"("subjectId", "studentId");

ALTER TABLE "SubjectEnrollment"
ADD CONSTRAINT "SubjectEnrollment_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubjectEnrollment"
ADD CONSTRAINT "SubjectEnrollment_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "SubjectEnrollment" ("id", "subjectId", "studentId", "createdAt")
SELECT
    gen_random_uuid()::text,
    s."id",
    st."id",
    CURRENT_TIMESTAMP
FROM "Subject" s
JOIN "Student" st
    ON st."semester" = s."semester"
    AND (s."department" IS NULL OR s."department" = '' OR st."department" = s."department")
LEFT JOIN "SubjectEnrollment" se
    ON se."subjectId" = s."id"
    AND se."studentId" = st."id"
WHERE se."id" IS NULL;
