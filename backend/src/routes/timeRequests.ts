import express, { Request, Response } from "express";
import { Prisma, TimeRequestStatus } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getPrisma } from "../lib/prisma";

const router = express.Router();
const prisma = getPrisma();

/**
 * ✅ Create a new time request
 */
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, title, description, duration, credits, proposedDate } = req.body as {
      receiverId?: string;
      title?: string;
      description?: string;
      duration?: number | string;
      credits?: number | string;
      proposedDate?: string;
    };

    if (!receiverId || !title || duration == null || credits == null) {
      return res.status(400).json({ error: "Missing required fields: receiverId, title, duration, credits" });
    }

    const senderId = req.user?.userId;
    if (!senderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newRequest = await prisma.timeRequest.create({
      data: {
        senderId,
        receiverId,
        title: title.trim(),
        description: (description || "").trim(),
        duration: String(Number(duration).toFixed(2)),
        credits: String(Number(credits).toFixed(2)),
        proposedDate: proposedDate ? new Date(proposedDate) : null,
        status: TimeRequestStatus.PENDING,
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        kind: "TIME_REQUEST",
        payload: { requestId: newRequest.id, title: title.trim(), senderId } as any,
      },
    });

    res.status(201).json(newRequest);
  } catch (err: any) {
    console.error("Error creating time request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * ✅ Get all time requests for a specific user
 */
router.get("/user/:userId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const requests = await prisma.timeRequest.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(requests);
  } catch (err: any) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * ✅ Update status (ACCEPTED / REJECTED)
 */
router.patch("/:id/status", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: TimeRequestStatus | string };

    const allowed = Object.values(TimeRequestStatus);
    if (!status || !allowed.includes(status as TimeRequestStatus)) {
      return res.status(400).json({ error: `Invalid status value. Allowed: ${allowed.join(", ")}` });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const request = await prisma.timeRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({ error: "Time request not found" });
    }

    // Only receiver can accept/reject, sender can cancel
    if (status === "ACCEPTED" || status === "REJECTED") {
      if (request.receiverId !== userId) {
        return res.status(403).json({ error: "Only the receiver can accept or reject requests" });
      }
    } else if (status === "CANCELLED") {
      if (request.senderId !== userId && request.receiverId !== userId) {
        return res.status(403).json({ error: "Only participants can cancel" });
      }
    }

    const updateData: any = { status: status as TimeRequestStatus };
    if (status === "ACCEPTED") {
      updateData.acceptedAt = new Date();
    } else if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.timeRequest.update({
      where: { id },
      data: updateData,
    });

    // If completed, create Transaction records for both users
    if (status === "COMPLETED") {
      const duration = Number(request.duration);
      const credits = Number(request.credits);
      
      await prisma.$transaction(async (tx) => {
        // Create Transaction records for both users
        await tx.transaction.createMany({
          data: [
            {
              senderId: request.senderId,
              receiverId: request.receiverId,
              amount: String(credits.toFixed(2)),
              type: "SPENT",
              status: "COMPLETED",
              description: `Time request: ${request.title}`,
              referenceId: request.id,
              completedAt: new Date(),
            },
            {
              senderId: request.senderId,
              receiverId: request.receiverId,
              amount: String(credits.toFixed(2)),
              type: "EARNED",
              status: "COMPLETED",
              description: `Time request: ${request.title}`,
              referenceId: request.id,
              completedAt: new Date(),
            },
          ],
        });

        // Update user credits (SQLite uses String, so we need to calculate manually)
        const receiver = await tx.user.findUnique({ where: { id: request.receiverId }, select: { credits: true } });
        const sender = await tx.user.findUnique({ where: { id: request.senderId }, select: { credits: true } });
        
        if (receiver) {
          const newReceiverCredits = (Number(receiver.credits) + credits).toFixed(2);
          await tx.user.update({
            where: { id: request.receiverId },
            data: { credits: newReceiverCredits },
          });
        }
        
        if (sender) {
          const newSenderCredits = Math.max(0, Number(sender.credits) - credits).toFixed(2);
          await tx.user.update({
            where: { id: request.senderId },
            data: { credits: newSenderCredits },
          });
        }

        // Create notifications
        await tx.notification.createMany({
          data: [
            { userId: request.senderId, kind: "TIME_REQUEST_COMPLETED", payload: { requestId: request.id } as any },
            { userId: request.receiverId, kind: "TIME_REQUEST_COMPLETED", payload: { requestId: request.id } as any },
          ],
        });
      });
    } else {
      // Create notification for status change
      const notifyUserId = status === "ACCEPTED" || status === "REJECTED" ? request.senderId : request.receiverId;
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          kind: `TIME_REQUEST_${status}`,
          payload: { requestId: request.id } as any,
        },
      });
    }

    res.json(updated);
  } catch (err: any) {
    console.error("Error updating request status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
