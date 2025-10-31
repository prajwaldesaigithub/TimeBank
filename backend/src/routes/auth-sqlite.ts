import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPrisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };

    if (!email || !password || !name)
      return res.status(400).json({ error: "Missing required fields: email, password, name" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Invalid email format" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    if (name.trim().length < 2)
      return res.status(400).json({ error: "Name must be at least 2 characters long" });

    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase().trim(), passwordHash, name: name.trim() }
    });

    // Create a basic profile shell
    await prisma.profile.create({
      data: {
        userId: user.id,
        displayName: name.trim(),
        avatarUrl: null,
        bio: null,
        skills: [],
        categories: [],
        languages: [],
        availability: {}
      }
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: err?.message || "Signup failed" });
  }
});

// Login endpoint expected by frontend
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields: email, password" });
    }
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: err?.message || "Login failed" });
  }
});

// Session endpoint expected by frontend
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const profile = await prisma.profile.findUnique({ where: { userId } });
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile,
    });
  } catch (err: any) {
    console.error("Me error:", err);
    return res.status(500).json({ error: err?.message || "Failed to fetch session" });
  }
});

export default router;
