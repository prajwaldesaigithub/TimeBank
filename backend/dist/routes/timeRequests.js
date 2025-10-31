"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = express_1.default.Router();
const prisma = (0, prisma_1.getPrisma)();
/**
 * ✅ Create a new time request
 */
router.post("/", auth_1.authMiddleware, async (req, res) => {
    try {
        const { receiverId, title, description, duration, credits, proposedDate } = req.body;
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
                duration: new client_1.Prisma.Decimal(duration),
                credits: new client_1.Prisma.Decimal(credits),
                proposedDate: proposedDate ? new Date(proposedDate) : null,
                status: client_1.TimeRequestStatus.PENDING,
            },
        });
        res.status(201).json(newRequest);
    }
    catch (err) {
        console.error("Error creating time request:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
/**
 * ✅ Get all time requests for a specific user
 */
router.get("/user/:userId", auth_1.authMiddleware, async (req, res) => {
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
    }
    catch (err) {
        console.error("Error fetching requests:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
/**
 * ✅ Update status (ACCEPTED / REJECTED)
 */
router.patch("/:id/status", auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowed = Object.values(client_1.TimeRequestStatus);
        if (!status || !allowed.includes(status)) {
            return res.status(400).json({ error: `Invalid status value. Allowed: ${allowed.join(", ")}` });
        }
        const updated = await prisma.timeRequest.update({
            where: { id },
            data: { status: status },
        });
        res.json(updated);
    }
    catch (err) {
        console.error("Error updating request status:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=timeRequests.js.map