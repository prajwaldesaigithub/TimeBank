"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// List notifications
router.get("/", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        const prisma = (0, prisma_1.getPrisma)();
        const page = Math.max(parseInt(String(req.query.page || "1"), 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1), 100);
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            prisma.notification.findMany({ where: { userId: req.user.userId }, orderBy: { createdAt: "desc" }, skip, take: limit }),
            prisma.notification.count({ where: { userId: req.user.userId } }),
        ]);
        return res.json({ items, page, limit, total });
    }
    catch (err) {
        console.error("GET /notifications error:", err);
        return res.status(500).json({ error: "Failed to list notifications" });
    }
});
// Mark read
router.post("/:id/read", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        const prisma = (0, prisma_1.getPrisma)();
        const id = String(req.params.id);
        const n = await prisma.notification.findUnique({ where: { id } });
        if (!n || n.userId !== req.user.userId)
            return res.status(404).json({ error: "Notification not found" });
        const updated = await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
        return res.json({ notification: updated });
    }
    catch (err) {
        console.error("POST /notifications/:id/read error:", err);
        return res.status(500).json({ error: "Failed to mark read" });
    }
});
// Bulk mark all as read
router.post("/read-all", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        const prisma = (0, prisma_1.getPrisma)();
        const result = await prisma.notification.updateMany({ where: { userId: req.user.userId, readAt: null }, data: { readAt: new Date() } });
        return res.json({ count: result.count });
    }
    catch (err) {
        console.error("POST /notifications/read-all error:", err);
        return res.status(500).json({ error: "Failed to mark all read" });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map