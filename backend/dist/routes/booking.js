"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// POST /booking -> create PENDING booking and thread
const createBookingSchema = zod_1.z.object({
    providerId: zod_1.z.string().min(1),
    hours: zod_1.z.number().positive().max(999),
    category: zod_1.z.string().min(1).max(120),
    note: zod_1.z.string().max(1000).optional(),
    preferredSlots: zod_1.z.array(zod_1.z.string()).optional(),
});
router.post("/", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        const parsed = createBookingSchema.safeParse(req.body ?? {});
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten() });
        const { providerId, hours, category, note } = parsed.data;
        if (providerId === req.user.userId)
            return res.status(400).json({ error: "Cannot request yourself" });
        const prisma = (0, prisma_1.getPrisma)();
        const booking = await prisma.booking.create({
            data: {
                providerId,
                receiverId: req.user.userId,
                hours: String(Number(hours).toFixed(2)),
                category: category.trim(),
                note: note?.trim() || null,
                status: "PENDING",
            },
        });
        const thread = await prisma.messageThread.create({ data: { bookingId: booking.id } });
        if (note && note.trim()) {
            await prisma.message.create({ data: { threadId: thread.id, senderId: req.user.userId, content: note.trim() } });
        }
        // Notify provider of new booking
        await prisma.notification.create({
            data: { userId: providerId, kind: "BOOKING_REQUEST", payload: { bookingId: booking.id, hours, category } },
        });
        return res.status(201).json({ booking });
    }
    catch (err) {
        console.error("POST /booking error:", err);
        return res.status(500).json({ error: "Failed to create booking" });
    }
});
// GET /booking?role=&status=
router.get("/", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        const prisma = (0, prisma_1.getPrisma)();
        const role = String(req.query.role || "").toLowerCase();
        const status = String(req.query.status || "").toUpperCase();
        const where = {};
        if (role === "provider")
            where.providerId = req.user.userId;
        else if (role === "receiver")
            where.receiverId = req.user.userId;
        else
            where.OR = [{ providerId: req.user.userId }, { receiverId: req.user.userId }];
        if (["PENDING", "ACCEPTED", "DECLINED", "CANCELLED", "COMPLETED"].includes(status))
            where.status = status;
        const bookings = await prisma.booking.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
        return res.json({ bookings });
    }
    catch (err) {
        console.error("GET /booking error:", err);
        return res.status(500).json({ error: "Failed to fetch bookings" });
    }
});
// PATCH /booking/:id/accept { slot }
router.patch("/:id/accept", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        const prisma = (0, prisma_1.getPrisma)();
        const booking = await prisma.booking.findUnique({ where: { id: String(req.params.id) } });
        if (!booking)
            return res.status(404).json({ error: "Booking not found" });
        if (booking.providerId !== req.user.userId)
            return res.status(403).json({ error: "Forbidden" });
        if (booking.status !== "PENDING")
            return res.status(400).json({ error: "Invalid state" });
        const slot = req.body?.slot;
        const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: "ACCEPTED", acceptedAt: new Date(), ...(slot ? { startAt: new Date(slot) } : {}) } });
        await prisma.notification.createMany({
            data: [
                { userId: booking.receiverId, kind: "BOOKING_ACCEPTED", payload: { bookingId: booking.id, slot } },
            ],
        });
        return res.json({ booking: updated });
    }
    catch (err) {
        console.error("PATCH /booking/:id/accept error:", err);
        return res.status(500).json({ error: "Failed to accept booking" });
    }
});
router.patch("/:id/decline", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        const prisma = (0, prisma_1.getPrisma)();
        const booking = await prisma.booking.findUnique({ where: { id: String(req.params.id) } });
        if (!booking)
            return res.status(404).json({ error: "Booking not found" });
        if (booking.providerId !== req.user.userId)
            return res.status(403).json({ error: "Forbidden" });
        if (booking.status !== "PENDING")
            return res.status(400).json({ error: "Invalid state" });
        const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: "DECLINED" } });
        await prisma.notification.createMany({
            data: [
                { userId: booking.receiverId, kind: "BOOKING_DECLINED", payload: { bookingId: booking.id } },
            ],
        });
        return res.json({ booking: updated });
    }
    catch (err) {
        console.error("PATCH /booking/:id/decline error:", err);
        return res.status(500).json({ error: "Failed to decline booking" });
    }
});
router.patch("/:id/cancel", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        const prisma = (0, prisma_1.getPrisma)();
        const booking = await prisma.booking.findUnique({ where: { id: String(req.params.id) } });
        if (!booking)
            return res.status(404).json({ error: "Booking not found" });
        if (booking.providerId !== req.user.userId && booking.receiverId !== req.user.userId)
            return res.status(403).json({ error: "Forbidden" });
        if (!["PENDING", "ACCEPTED"].includes(booking.status))
            return res.status(400).json({ error: "Invalid state" });
        const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
        const counterpartId = booking.providerId === req.user.userId ? booking.receiverId : booking.providerId;
        await prisma.notification.createMany({
            data: [
                { userId: counterpartId, kind: "BOOKING_CANCELLED", payload: { bookingId: booking.id } },
            ],
        });
        return res.json({ booking: updated });
    }
    catch (err) {
        console.error("PATCH /booking/:id/cancel error:", err);
        return res.status(500).json({ error: "Failed to cancel booking" });
    }
});
// Completion flow (propose/confirm) simplified: confirm moves ledger atomically
router.post("/:id/complete-confirm", auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        const prisma = (0, prisma_1.getPrisma)();
        const booking = await prisma.booking.findUnique({ where: { id: String(req.params.id) } });
        if (!booking)
            return res.status(404).json({ error: "Booking not found" });
        if (booking.status !== "ACCEPTED")
            return res.status(400).json({ error: "Booking not accepted" });
        // Only participants can confirm
        if (booking.providerId !== req.user.userId && booking.receiverId !== req.user.userId)
            return res.status(403).json({ error: "Forbidden" });
        // Check receiver balance after SPENT
        const [earnedAgg, spentAgg] = await Promise.all([
            prisma.ledgerEntry.aggregate({ _sum: { hours: true }, where: { userId: booking.receiverId, type: "EARNED" } }),
            prisma.ledgerEntry.aggregate({ _sum: { hours: true }, where: { userId: booking.receiverId, type: "SPENT" } }),
        ]);
        const current = Number(earnedAgg._sum.hours || 0) - Number(spentAgg._sum.hours || 0);
        const hours = Number(booking.hours);
        if (current - hours < 0)
            return res.status(400).json({ error: "Insufficient balance" });
        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED", completedAt: new Date() } });
            await tx.ledgerEntry.createMany({
                data: [
                    { userId: booking.providerId, hours: String(hours.toFixed(2)), type: "EARNED", description: "Session completed", refBookingId: booking.id },
                    { userId: booking.receiverId, hours: String(hours.toFixed(2)), type: "SPENT", description: "Session completed", refBookingId: booking.id },
                ],
            });
            // Reputation updates: +10 provider, +5 receiver
            await tx.user.update({ where: { id: booking.providerId }, data: { reputation: { increment: 10 } } });
            await tx.user.update({ where: { id: booking.receiverId }, data: { reputation: { increment: 5 } } });
            // Notifications
            await tx.notification.createMany({
                data: [
                    { userId: booking.providerId, kind: "BOOKING_COMPLETED", payload: { bookingId: booking.id } },
                    { userId: booking.receiverId, kind: "BOOKING_COMPLETED", payload: { bookingId: booking.id } },
                    { userId: booking.providerId, kind: "CREDIT_EARNED", payload: { hours } },
                    { userId: booking.receiverId, kind: "CREDIT_SPENT", payload: { hours } },
                ],
            });
            return updated;
        });
        return res.json({ booking: result });
    }
    catch (err) {
        console.error("POST /booking/:id/complete-confirm error:", err);
        return res.status(500).json({ error: "Failed to confirm completion" });
    }
});
exports.default = router;
//# sourceMappingURL=booking.js.map