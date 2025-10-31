"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const prisma = (0, prisma_1.getPrisma)();
// Validation schemas
const createRatingSchema = zod_1.z.object({
    ratedId: zod_1.z.string(),
    bookingId: zod_1.z.string().optional(),
    score: zod_1.z.number().min(1).max(5),
    comment: zod_1.z.string().max(500).optional()
});
// Create a rating
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const validatedData = createRatingSchema.parse(req.body);
        // Check if user is trying to rate themselves
        if (userId === validatedData.ratedId) {
            return res.status(400).json({ error: 'Cannot rate yourself' });
        }
        // Check if rated user exists
        const ratedUser = await prisma.user.findUnique({
            where: { id: validatedData.ratedId }
        });
        if (!ratedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // If bookingId is provided, verify the user was involved in the booking
        if (validatedData.bookingId) {
            const booking = await prisma.booking.findUnique({
                where: { id: validatedData.bookingId },
                select: { providerId: true, receiverId: true, status: true }
            });
            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            if (booking.status !== 'COMPLETED') {
                return res.status(400).json({ error: 'Can only rate completed bookings' });
            }
            if (booking.providerId !== userId && booking.receiverId !== userId) {
                return res.status(403).json({ error: 'Not authorized to rate this booking' });
            }
            if (booking.providerId !== validatedData.ratedId && booking.receiverId !== validatedData.ratedId) {
                return res.status(400).json({ error: 'User was not involved in this booking' });
            }
        }
        // Check if rating already exists
        const existingRating = await prisma.rating.findFirst({
            where: {
                raterId: userId,
                ratedId: validatedData.ratedId,
                bookingId: validatedData.bookingId || null
            }
        });
        if (existingRating) {
            return res.status(400).json({ error: 'Rating already exists for this user/booking' });
        }
        // Create the rating
        const rating = await prisma.rating.create({
            data: {
                raterId: userId,
                ratedId: validatedData.ratedId,
                bookingId: validatedData.bookingId,
                score: validatedData.score,
                comment: validatedData.comment
            },
            include: {
                rater: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                },
                rated: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            }
        });
        // Update user's average rating
        await updateUserRating(validatedData.ratedId);
        // Create notification for rated user
        await prisma.notification.create({
            data: {
                userId: validatedData.ratedId,
                kind: 'NEW_RATING',
                payload: {
                    ratingId: rating.id,
                    raterName: rating.rater.name,
                    score: rating.score,
                    comment: rating.comment
                }
            }
        });
        res.status(201).json(rating);
    }
    catch (error) {
        console.error('Error creating rating:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get ratings for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const [ratings, totalCount] = await Promise.all([
            prisma.rating.findMany({
                where: { ratedId: userId },
                include: {
                    rater: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                            profile: {
                                select: {
                                    displayName: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.rating.count({
                where: { ratedId: userId }
            })
        ]);
        // Get user's profile for rating stats
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                profile: {
                    select: {
                        ratingAvg: true,
                        totalRatings: true
                    }
                }
            }
        });
        res.json({
            ratings,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                pages: Math.ceil(totalCount / limitNum)
            },
            stats: {
                averageRating: user?.profile?.ratingAvg || 0,
                totalRatings: user?.profile?.totalRatings || 0
            }
        });
    }
    catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get user's reputation score and badge
router.get('/user/:userId/reputation', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
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
        const averageRating = user.profile?.ratingAvg || 0;
        const totalRatings = user.profile?.totalRatings || 0;
        const reputation = user.reputation;
        // Calculate trust badge
        let badge = 'Bronze';
        if (averageRating >= 4.5 && totalRatings >= 20) {
            badge = 'Gold';
        }
        else if (averageRating >= 4.0 && totalRatings >= 10) {
            badge = 'Silver';
        }
        res.json({
            reputation,
            averageRating,
            totalRatings,
            badge,
            trustScore: Math.round((averageRating * 20) + (reputation * 0.1)) // Combined score
        });
    }
    catch (error) {
        console.error('Error fetching reputation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Helper function to update user's average rating
async function updateUserRating(userId) {
    const ratings = await prisma.rating.findMany({
        where: { ratedId: userId },
        select: { score: true }
    });
    if (ratings.length > 0) {
        const averageRating = ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length;
        await prisma.profile.update({
            where: { userId },
            data: {
                ratingAvg: averageRating,
                totalRatings: ratings.length
            }
        });
        // Update reputation based on recent ratings (last 10)
        const recentRatings = await prisma.rating.findMany({
            where: { ratedId: userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { score: true }
        });
        const recentAverage = recentRatings.reduce((sum, rating) => sum + rating.score, 0) / recentRatings.length;
        const reputation = Math.round(recentAverage * 20); // Scale to 0-100
        await prisma.user.update({
            where: { id: userId },
            data: { reputation }
        });
    }
}
exports.default = router;
//# sourceMappingURL=ratings.js.map