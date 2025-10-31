-- CreateEnum
CREATE TYPE "TimeRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EARNED', 'SPENT', 'TRANSFER', 'REFUND', 'BONUS');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "credits" DECIMAL(10,2) NOT NULL DEFAULT 10,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "introMedia" TEXT,
ADD COLUMN     "isComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "hourlyRate" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "receiverId" TEXT,
ADD COLUMN     "messageType" TEXT NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "readAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TimeRequest" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" DECIMAL(4,2) NOT NULL,
    "proposedDate" TIMESTAMP(3),
    "status" "TimeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "credits" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TimeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "ratedId" TEXT NOT NULL,
    "bookingId" TEXT,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeRequest_senderId_idx" ON "TimeRequest"("senderId");

-- CreateIndex
CREATE INDEX "TimeRequest_receiverId_idx" ON "TimeRequest"("receiverId");

-- CreateIndex
CREATE INDEX "TimeRequest_status_idx" ON "TimeRequest"("status");

-- CreateIndex
CREATE INDEX "Rating_ratedId_idx" ON "Rating"("ratedId");

-- CreateIndex
CREATE INDEX "Transaction_senderId_idx" ON "Transaction"("senderId");

-- CreateIndex
CREATE INDEX "Transaction_receiverId_idx" ON "Transaction"("receiverId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Message_requestId_idx" ON "Message"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_raterId_ratedId_bookingId_key" ON "Rating"("raterId", "ratedId", "bookingId");

-- AddForeignKey
ALTER TABLE "TimeRequest" ADD CONSTRAINT "TimeRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeRequest" ADD CONSTRAINT "TimeRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_ratedId_fkey" FOREIGN KEY ("ratedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TimeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
