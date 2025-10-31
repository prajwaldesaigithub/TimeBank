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
        duration: new Prisma.Decimal(duration as any),
        credits: new Prisma.Decimal(credits as any),
        proposedDate: proposedDate ? new Date(proposedDate) : null,
        status: TimeRequestStatus.PENDING,
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

    const updated = await prisma.timeRequest.update({
      where: { id },
      data: { status: status as TimeRequestStatus },
    });

    res.json(updated);
  } catch (err: any) {
    console.error("Error updating request status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
