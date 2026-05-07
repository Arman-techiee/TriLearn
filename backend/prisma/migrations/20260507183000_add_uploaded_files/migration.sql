CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "storage" TEXT NOT NULL DEFAULT 'LOCAL',
    "entityType" TEXT,
    "entityId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UploadedFile_fileName_key" ON "UploadedFile"("fileName");

CREATE INDEX "UploadedFile_uploadedById_idx" ON "UploadedFile"("uploadedById");

CREATE INDEX "UploadedFile_entityType_entityId_idx" ON "UploadedFile"("entityType", "entityId");

ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
