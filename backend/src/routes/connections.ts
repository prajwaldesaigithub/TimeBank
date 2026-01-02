import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getPrisma } from "../lib/prisma";

const router = Router();

// Follow a user
router.post("/:userId/follow", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const followerId = req.user?.userId;
    const followeeId = req.params.userId;

    if (!followerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (followerId === followeeId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const prisma = getPrisma();

    // Check if followee exists
    const followee = await prisma.user.findUnique({
      where: { id: followeeId },
    });

    if (!followee) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already following
    const existing = await prisma.connection.findUnique({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Already following this user" });
    }

    // Create follow connection
    const connection = await prisma.connection.create({
      data: {
        followerId,
        followeeId,
      },
    });

    // Create notification for followee
    await prisma.notification.create({
      data: {
        userId: followeeId,
        kind: "FOLLOW",
        payload: { followerId, followerName: req.user?.email } as any,
      },
    });

    res.status(201).json({ success: true, connection });
  } catch (err: any) {
    console.error("Follow error:", err);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

// Unfollow a user
router.delete("/:userId/follow", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const followerId = req.user?.userId;
    const followeeId = req.params.userId;

    if (!followerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const prisma = getPrisma();

    const connection = await prisma.connection.deleteMany({
      where: {
        followerId,
        followeeId,
      },
    });

    res.json({ success: true, deleted: connection.count > 0 });
  } catch (err: any) {
    console.error("Unfollow error:", err);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

// Check if following a user
router.get("/:userId/following", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const followerId = req.user?.userId;
    const followeeId = req.params.userId;

    if (!followerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const prisma = getPrisma();

    const connection = await prisma.connection.findUnique({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId,
        },
      },
    });

    res.json({ isFollowing: !!connection });
  } catch (err: any) {
    console.error("Check following error:", err);
    res.status(500).json({ error: "Failed to check follow status" });
  }
});

// Get user's followers
router.get("/:userId/followers", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId;
    const prisma = getPrisma();

    const connections = await prisma.connection.findMany({
      where: { followeeId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    res.json({ followers: connections.map((c) => c.follower) });
  } catch (err: any) {
    console.error("Get followers error:", err);
    res.status(500).json({ error: "Failed to get followers" });
  }
});

// Get users that a user is following
router.get("/:userId/following-list", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId;
    const prisma = getPrisma();

    const connections = await prisma.connection.findMany({
      where: { followerId: userId },
      include: {
        followee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    res.json({ following: connections.map((c) => c.followee) });
  } catch (err: any) {
    console.error("Get following list error:", err);
    res.status(500).json({ error: "Failed to get following list" });
  }
});

export default router;

