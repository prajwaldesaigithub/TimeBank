"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// GET /wallet/balance -> compute from LedgerEntry (EARNED - SPENT)
router.get("/balance", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "User not authenticated" });
        const prisma = (0, prisma_1.getPrisma)();
        const [earnedAgg, spentAgg] = await Promise.all([
            prisma.ledgerEntry.aggregate({
                _sum: { hours: true },
                where: { userId: req.user.userId, type: "EARNED" }
            }),
            prisma.ledgerEntry.aggregate({
                _sum: { hours: true },
                where: { userId: req.user.userId, type: "SPENT" }
            })
        ]);
        const earned = Number(earnedAgg._sum.hours || 0);
        const spent = Number(spentAgg._sum.hours || 0);
        const balance = +(earned - spent).toFixed(2);
        return res.json({ balance, earned, spent });
    }
    catch (err) {
        console.error("Error computing balance:", err);
        return res.status(500).json({ error: "Failed to compute balance" });
    }
});
// GET /wallet/history -> list ledger entries
router.get("/history", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "User not authenticated" });
        const prisma = (0, prisma_1.getPrisma)();
        const page = Math.max(parseInt(String(req.query.page || "1"), 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1), 100);
        const skip = (page - 1) * limit;
        const type = String(req.query.type || "").toUpperCase();
        const where = { userId: req.user.userId };
        if (type === "EARNED" || type === "SPENT")
            where.type = type;
        const [items, total] = await Promise.all([
            prisma.ledgerEntry.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
            prisma.ledgerEntry.count({ where })
        ]);
        return res.json({ items, page, limit, total });
    }
    catch (err) {
        console.error("Error fetching ledger history:", err);
        return res.status(500).json({ error: "Failed to fetch history" });
    }
});
exports.default = router;
// Analytics endpoints
router.get("/analytics/credits", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "User not authenticated" });
        const prisma = (0, prisma_1.getPrisma)();
        // Aggregate earned/spent per month (last 6 months)
        const since = new Date();
        since.setMonth(since.getMonth() - 6);
        const entries = await prisma.ledgerEntry.findMany({
            where: { userId: req.user.userId, createdAt: { gte: since } },
            orderBy: { createdAt: "asc" },
            select: { createdAt: true, hours: true, type: true },
        });
        const buckets = {};
        for (const e of entries) {
            const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, "0")}`;
            if (!buckets[key])
                buckets[key] = { earned: 0, spent: 0 };
            if (e.type === "EARNED")
                buckets[key].earned += Number(e.hours);
            else
                buckets[key].spent += Number(e.hours);
        }
        const series = Object.entries(buckets).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => ({ period: k, earned: +v.earned.toFixed(2), spent: +v.spent.toFixed(2) }));
        return res.json({ series });
    }
    catch (err) {
        console.error("GET /wallet/analytics/credits error:", err);
        return res.status(500).json({ error: "Failed to fetch credits analytics" });
    }
});
router.get("/analytics/collaborators", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "User not authenticated" });
        const prisma = (0, prisma_1.getPrisma)();
        // Count completed bookings grouped by counterpart
        const bookings = await prisma.booking.findMany({
            where: { OR: [{ providerId: req.user.userId }, { receiverId: req.user.userId }], status: "COMPLETED" },
            select: { providerId: true, receiverId: true },
        });
        const counter = {};
        for (const b of bookings) {
            const counterpart = b.providerId === req.user.userId ? b.receiverId : b.providerId;
            counter[counterpart] = (counter[counterpart] || 0) + 1;
        }
        const top = Object.entries(counter).sort((a, b) => b[1] - a[1]).slice(0, 3);
        return res.json({ top: top.map(([userId, count]) => ({ userId, count })) });
    }
    catch (err) {
        console.error("GET /wallet/analytics/collaborators error:", err);
        return res.status(500).json({ error: "Failed to fetch collaborators analytics" });
    }
});
//# sourceMappingURL=wallet.js.map