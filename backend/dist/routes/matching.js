"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// GET /matching/search?skills=a,b&minRep=0&location=txt
router.get("/search", auth_1.authMiddleware, async (req, res) => {
    try {
        const prisma = (0, prisma_1.getPrisma)();
        const skills = String(req.query.skills || "").split(",").map((s) => s.trim()).filter(Boolean);
        const location = String(req.query.location || "").trim();
        const minRep = Math.max(parseInt(String(req.query.minRep || "0"), 10) || 0, 0);
        const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1), 50);
        const profiles = await prisma.profile.findMany({
            where: {
                AND: [
                    skills.length ? { skills: { hasSome: skills } } : {},
                    location ? { location: { contains: location, mode: "insensitive" } } : {},
                    { user: { reputation: { gte: minRep } } },
                ],
            },
            take: limit,
            orderBy: { ratingAvg: "desc" },
            select: { id: true, userId: true, displayName: true, skills: true, categories: true, location: true, ratingAvg: true },
        });
        return res.json({ matches: profiles });
    }
    catch (err) {
        console.error("GET /matching/search error:", err);
        return res.status(500).json({ error: "Failed to search matches" });
    }
});
// POST /matching/auto - finds best match for a requested category/skills
const autoSchema = zod_1.z.object({ category: zod_1.z.string().min(1), skills: zod_1.z.array(zod_1.z.string()).optional() });
router.post("/auto", auth_1.authMiddleware, async (req, res) => {
    try {
        const parsed = autoSchema.safeParse(req.body ?? {});
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten() });
        const prisma = (0, prisma_1.getPrisma)();
        const { category, skills = [] } = parsed.data;
        const candidates = await prisma.profile.findMany({
            where: {
                AND: [
                    { categories: { has: category } },
                    skills.length ? { skills: { hasSome: skills } } : {},
                ],
            },
            select: { id: true, userId: true, displayName: true, skills: true, categories: true, ratingAvg: true, user: { select: { reputation: true } } },
            take: 50,
        });
        // Score: reputation weight + ratingAvg + skill overlap
        const skillSet = new Set(skills);
        const scored = candidates.map((c) => {
            const overlap = c.skills.filter((s) => skillSet.has(s)).length;
            const rep = c.user?.reputation ?? 0;
            const rating = c.ratingAvg ?? 0;
            const score = rep * 0.6 + rating * 0.3 + overlap * 0.1;
            return { c, score };
        }).sort((a, b) => b.score - a.score);
        const best = scored[0]?.c || null;
        return res.json({ bestMatch: best, candidates: scored.slice(0, 10).map((s) => ({ ...s.c, score: s.score })) });
    }
    catch (err) {
        console.error("POST /matching/auto error:", err);
        return res.status(500).json({ error: "Failed to auto match" });
    }
});
exports.default = router;
//# sourceMappingURL=matching.js.map