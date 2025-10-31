import { Router, type Response } from "express";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { getPrisma } from "../lib/prisma";
import { z } from "zod";

const router = Router();

// Rule-based + cosine-ish similarity on skills and categories
const recSchema = z.object({ limit: z.number().min(1).max(20).optional() });
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const prisma = getPrisma();
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || "10"), 10) || 10, 1), 20);

    const me = await prisma.profile.findUnique({ where: { userId: req.user.userId } });
    if (!me) return res.status(404).json({ error: "Profile not found" });

    const mySkills = new Set(me.skills || []);
    const myCategories = new Set(me.categories || []);

    const others = await prisma.profile.findMany({
      where: { userId: { not: req.user.userId } },
      take: 200,
      select: { id: true, userId: true, displayName: true, skills: true, categories: true, ratingAvg: true, user: { select: { reputation: true } } },
    });

    const scored = others.map((p) => {
      const skillOverlap = p.skills.filter((s) => mySkills.has(s)).length;
      const catOverlap = p.categories.filter((c) => myCategories.has(c)).length;
      const rep = p.user?.reputation ?? 0;
      const rating = p.ratingAvg ?? 0;
      const score = skillOverlap * 0.5 + catOverlap * 0.3 + rep * 0.15 + rating * 0.05;
      return { p, score };
    }).sort((a, b) => b.score - a.score);

    return res.json({ recommendations: scored.slice(0, limit).map((s) => ({ ...s.p, score: s.score })) });
  } catch (err) {
    console.error("GET /recommendations error:", err);
    return res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

export default router;


