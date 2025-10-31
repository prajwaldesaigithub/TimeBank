"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const prisma = (0, prisma_1.getPrisma)();
// Validation schemas
const buyCreditsSchema = zod_1.z.object({
    amount: zod_1.z.number().positive().max(1000), // Max 1000 credits per purchase
    paymentMethod: zod_1.z.string().optional()
});
// Get user's wallet/credit balance
router.get('/wallet', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                credits: true,
                reputation: true,
                profile: {
                    select: {
                        ratingAvg: true,
                        totalRatings: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            credits: user.credits,
            reputation: user.reputation,
            averageRating: user.profile?.ratingAvg || 0,
            totalRatings: user.profile?.totalRatings || 0
        });
    }
    catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get user's transaction history
router.get('/history', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { page = '1', limit = '20', type } = req.query;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const whereClause = {
            OR: [
                { senderId: userId },
                { receiverId: userId }
            ]
        };
        if (type) {
            whereClause.type = type;
        }
        const [transactions, totalCount] = await Promise.all([
            prisma.transaction.findMany({
                where: whereClause,
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.transaction.count({
                where: whereClause
            })
        ]);
        // Format transactions for display
        const formattedTransactions = transactions.map(transaction => ({
            ...transaction,
            isIncoming: transaction.receiverId === userId,
            otherUser: transaction.senderId === userId ? transaction.receiver : transaction.sender
        }));
        res.json({
            transactions: formattedTransactions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                pages: Math.ceil(totalCount / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Buy credits (mock implementation)
router.post('/buy-credits', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const validatedData = buyCreditsSchema.parse(req.body);
        // In a real implementation, you would integrate with a payment processor
        // For now, we'll just add the credits directly
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                credits: {
                    increment: validatedData.amount
                }
            }
        });
        // Create transaction record
        const transaction = await prisma.transaction.create({
            data: {
                senderId: userId,
                amount: validatedData.amount,
                type: 'BONUS', // In real app, this would be 'PURCHASE'
                status: 'COMPLETED',
                description: `Purchased ${validatedData.amount} credits`,
                completedAt: new Date()
            }
        });
        res.json({
            success: true,
            newBalance: user.credits,
            transaction
        });
    }
    catch (error) {
        console.error('Error buying credits:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Transfer credits to another user
router.post('/transfer', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { receiverId, amount, description } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!receiverId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid transfer details' });
        }
        if (receiverId === userId) {
            return res.status(400).json({ error: 'Cannot transfer to yourself' });
        }
        // Check if receiver exists
        const receiver = await prisma.user.findUnique({
            where: { id: receiverId }
        });
        if (!receiver) {
            return res.status(404).json({ error: 'Receiver not found' });
        }
        // Check if sender has enough credits
        const sender = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!sender || sender.credits < amount) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }
        // Perform the transfer
        await prisma.$transaction(async (tx) => {
            // Deduct from sender
            await tx.user.update({
                where: { id: userId },
                data: {
                    credits: {
                        decrement: amount
                    }
                }
            });
            // Add to receiver
            await tx.user.update({
                where: { id: receiverId },
                data: {
                    credits: {
                        increment: amount
                    }
                }
            });
            // Create transaction record
            await tx.transaction.create({
                data: {
                    senderId: userId,
                    receiverId: receiverId,
                    amount: amount,
                    type: 'TRANSFER',
                    status: 'COMPLETED',
                    description: description || 'Credit transfer',
                    completedAt: new Date()
                }
            });
        });
        // Get updated balance
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true }
        });
        res.json({
            success: true,
            newBalance: updatedUser?.credits || 0
        });
    }
    catch (error) {
        console.error('Error transferring credits:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get transaction statistics
router.get('/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const [totalEarned, totalSpent, totalTransferred, completedTransactions, pendingTransactions] = await Promise.all([
            prisma.transaction.aggregate({
                where: {
                    receiverId: userId,
                    type: 'EARNED',
                    status: 'COMPLETED'
                },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: {
                    senderId: userId,
                    type: 'SPENT',
                    status: 'COMPLETED'
                },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: {
                    OR: [
                        { senderId: userId, type: 'TRANSFER' },
                        { receiverId: userId, type: 'TRANSFER' }
                    ],
                    status: 'COMPLETED'
                },
                _sum: { amount: true }
            }),
            prisma.transaction.count({
                where: {
                    OR: [
                        { senderId: userId },
                        { receiverId: userId }
                    ],
                    status: 'COMPLETED'
                }
            }),
            prisma.transaction.count({
                where: {
                    OR: [
                        { senderId: userId },
                        { receiverId: userId }
                    ],
                    status: 'PENDING'
                }
            })
        ]);
        res.json({
            totalEarned: totalEarned._sum.amount || 0,
            totalSpent: totalSpent._sum.amount || 0,
            totalTransferred: totalTransferred._sum.amount || 0,
            completedTransactions,
            pendingTransactions
        });
    }
    catch (error) {
        console.error('Error fetching transaction stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=transactions.js.map