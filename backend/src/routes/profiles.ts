import { Router, type Response } from "express";
import { getPrisma } from "../lib/prisma";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { parseProfileArrays } from "../lib/parseProfile";

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

    // Note: SQLite stores skills/categories as JSON strings, so we'll filter in JavaScript
    const skillsFilter = skills.length > 0 ? skills : null;
    const categoriesFilter = categories.length > 0 ? categories : null;
    
    const where: any = {
      AND: [
        query ? { 
          OR: [
            { displayName: { contains: query } }, 
            { bio: { contains: query } }
          ] 
        } : {},
        location ? { location: { contains: location } } : {},
      ],
    };

    const items = await prisma.profile.findMany({
      where,
      orderBy: { displayName: "asc" },
      take: (take + 1) * 2, // Fetch more to account for filtering
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
    
    // Filter by skills/categories if needed (SQLite stores as JSON strings)
    let filteredItems = items;
    if (skillsFilter && skillsFilter.length > 0) {
      filteredItems = filteredItems.filter((profile: any) => {
        const profileSkills = parseProfileArrays(profile).skills;
        return skillsFilter.some((skill: string) => profileSkills.includes(skill));
      });
    }
    if (categoriesFilter && categoriesFilter.length > 0) {
      filteredItems = filteredItems.filter((profile: any) => {
        const profileCategories = parseProfileArrays(profile).categories;
        return categoriesFilter.some((category: string) => profileCategories.includes(category));
      });
    }
    
    const hasMore = filteredItems.length > take;
    const profiles = hasMore ? filteredItems.slice(0, take) : filteredItems;
    const nextCursor = hasMore ? profiles[profiles.length - 1].id : null;
    // Parse JSON strings to arrays for SQLite compatibility
    const parsedProfiles = profiles.map(parseProfileArrays);
    res.json({ profiles: parsedProfiles, nextCursor });
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
    // Parse JSON strings to arrays for SQLite compatibility
    res.json({ profile: parseProfileArrays(profile) });
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
    // Parse JSON strings to arrays for SQLite compatibility
    return res.json({ profile: parseProfileArrays(profile) });
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
    // Convert arrays to JSON strings for SQLite storage
    const updateData: any = { ...parsed.data };
    if (updateData.skills) updateData.skills = JSON.stringify(updateData.skills);
    if (updateData.categories) updateData.categories = JSON.stringify(updateData.categories);
    if (updateData.languages) updateData.languages = JSON.stringify(updateData.languages);
    
    const profile = await prisma.profile.update({ where: { userId: req.user.userId }, data: updateData });
    // Parse JSON strings to arrays for response
    return res.json({ profile: parseProfileArrays(profile) });
  } catch (err) {
    console.error("PATCH /profiles/me error:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});


