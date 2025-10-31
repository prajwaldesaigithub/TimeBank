"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
router.post("/signup", async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name)
            return res.status(400).json({ error: "Missing required fields: email, password, name" });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return res.status(400).json({ error: "Invalid email format" });
        if (password.length < 6)
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        if (name.trim().length < 2)
            return res.status(400).json({ error: "Name must be at least 2 characters long" });
        const prisma = (0, prisma_1.getPrisma)();
        const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existing)
            return res.status(409).json({ error: "Email already registered" });
        const passwordHash = await bcrypt_1.default.hash(password, 12);
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
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        return res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
    }
    catch (err) {
        console.error("Signup error:", err);
        return res.status(500).json({ error: err?.message || "Signup failed" });
    }
});
// Login endpoint expected by frontend
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Missing required fields: email, password" });
        }
        const prisma = (0, prisma_1.getPrisma)();
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const ok = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!ok) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    }
    catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: err?.message || "Login failed" });
    }
});
// Session endpoint expected by frontend
router.get("/me", auth_1.authMiddleware, async (req, res) => {
    try {
        const prisma = (0, prisma_1.getPrisma)();
        const userId = req.user.userId;
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
    }
    catch (err) {
        console.error("Me error:", err);
        return res.status(500).json({ error: err?.message || "Failed to fetch session" });
    }
});
exports.default = router;
//# sourceMappingURL=auth-sqlite.js.map