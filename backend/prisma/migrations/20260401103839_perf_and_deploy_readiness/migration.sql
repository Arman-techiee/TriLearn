-- CreateIndex
CREATE INDEX "Assignment_subjectId_idx" ON "Assignment"("subjectId");

-- CreateIndex
CREATE INDEX "Assignment_instructorId_idx" ON "Assignment"("instructorId");

-- CreateIndex
CREATE INDEX "Assignment_dueDate_idx" ON "Assignment"("dueDate");

-- CreateIndex
CREATE INDEX "Instructor_department_idx" ON "Instructor"("department");

-- CreateIndex
CREATE INDEX "Notice_type_idx" ON "Notice"("type");

-- CreateIndex
CREATE INDEX "Notice_createdAt_idx" ON "Notice"("createdAt");

-- CreateIndex
CREATE INDEX "Routine_dayOfWeek_idx" ON "Routine"("dayOfWeek");

-- CreateIndex
CREATE INDEX "Routine_subjectId_idx" ON "Routine"("subjectId");

-- CreateIndex
CREATE INDEX "Routine_instructorId_idx" ON "Routine"("instructorId");

-- CreateIndex
CREATE INDEX "Student_semester_idx" ON "Student"("semester");

-- CreateIndex
CREATE INDEX "Student_department_idx" ON "Student"("department");

-- CreateIndex
CREATE INDEX "Student_semester_department_idx" ON "Student"("semester", "department");

-- CreateIndex
CREATE INDEX "StudyMaterial_subjectId_idx" ON "StudyMaterial"("subjectId");

-- CreateIndex
CREATE INDEX "StudyMaterial_instructorId_idx" ON "StudyMaterial"("instructorId");

-- CreateIndex
CREATE INDEX "Subject_semester_idx" ON "Subject"("semester");

-- CreateIndex
CREATE INDEX "Subject_department_idx" ON "Subject"("department");

-- CreateIndex
CREATE INDEX "Subject_instructorId_idx" ON "Subject"("instructorId");

-- CreateIndex
CREATE INDEX "Submission_assignmentId_idx" ON "Submission"("assignmentId");

-- CreateIndex
CREATE INDEX "Submission_studentId_idx" ON "Submission"("studentId");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
