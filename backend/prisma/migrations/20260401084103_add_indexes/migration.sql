-- CreateIndex
CREATE INDEX "Attendance_studentId_subjectId_date_idx" ON "Attendance"("studentId", "subjectId", "date");

-- CreateIndex
CREATE INDEX "Attendance_subjectId_date_idx" ON "Attendance"("subjectId", "date");

-- CreateIndex
CREATE INDEX "Mark_studentId_subjectId_idx" ON "Mark"("studentId", "subjectId");

-- CreateIndex
CREATE INDEX "SubjectEnrollment_studentId_idx" ON "SubjectEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "SubjectEnrollment_subjectId_idx" ON "SubjectEnrollment"("subjectId");
