import { Router, type Response } from "express";
import { getPrisma } from "../lib/prisma";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { z } from "zod";

const router = Router();

// GET /profiles?query=&skills=&categories=&availableFrom=&location=&take=&cursor=
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const query = String(req.query.query || "").trim();
    const skills = String(req.query.skills || "").split(",").map((s) => s.trim()).filter(Boolean);
    const categories = String(req.query.categories || "").split(",").map((s) => s.trim()).filter(Boolean);
    const location = String(req.query.location || "").trim();
    const take = Math.min(Math.max(parseInt(String(req.query.take || "20"), 10) || 20, 1), 50);
    const cursor = req.query.cursor ? { id: String(req.query.cursor) } : undefined;

    const where: any = {
      AND: [
        query ? { OR: [{ displayName: { contains: query, mode: "insensitive" } }, { bio: { contains: query, mode: "insensitive" } }] } : {},
        skills.length ? { skills: { hasSome: skills } } : {},
        categories.length ? { categories: { hasSome: categories } } : {},
        location ? { location: { contains: location, mode: "insensitive" } } : {},
      ],
    };

    const items = await prisma.profile.findMany({
      where,
      orderBy: { displayName: "asc" },
      take: take + 1,
      ...(cursor ? { cursor, skip: 1 } : {}),
      select: {
        id: true,
        userId: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        skills: true,
        categories: true,
        availability: true,
        location: true,
        ratingAvg: true,
      },
    });
    const hasMore = items.length > take;
    const profiles = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? profiles[profiles.length - 1].id : null;
    res.json({ profiles, nextCursor });
  } catch (err) {
    console.error("GET /profiles error:", err);
    res.status(500).json({ error: "Failed to list profiles" });
  }
});

// GET /profiles/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const profile = await prisma.profile.findUnique({
      where: { id: String(req.params.id) },
      select: {
        id: true,
        userId: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        skills: true,
        categories: true,
        availability: true,
        location: true,
        ratingAvg: true,
      },
    });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json({ profile });
  } catch (err) {
    console.error("GET /profiles/:id error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;

// Authenticated profile read/update
const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string()).max(50).optional(),
  categories: z.array(z.string()).max(50).optional(),
  availability: z.record(z.any()).optional(),
  location: z.string().max(120).optional(),
});

router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const prisma = getPrisma();
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.userId } });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.json({ profile });
  } catch (err) {
    console.error("GET /profiles/me error:", err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.patch("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const parsed = updateProfileSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const prisma = getPrisma();
    const profile = await prisma.profile.update({ where: { userId: req.user.userId }, data: parsed.data as any });
    return res.json({ profile });
  } catch (err) {
    console.error("PATCH /profiles/me error:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});


