DO $$
BEGIN
  CREATE TYPE "AbsenceTicketStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "AbsenceTicket"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "AbsenceTicket"
  ALTER COLUMN "status" TYPE "AbsenceTicketStatus"
  USING ("status"::"AbsenceTicketStatus");

ALTER TABLE "AbsenceTicket"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';
