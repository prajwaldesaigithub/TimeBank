-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_threadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_receiverId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "threadId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "totalRatings" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "reputation" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "penalty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_bookingId_key" ON "Dispute"("bookingId");

-- CreateIndex
CREATE INDEX "Dispute_raisedById_idx" ON "Dispute"("raisedById");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
