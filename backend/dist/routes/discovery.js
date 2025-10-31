"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Validation schemas
const searchUsersSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional(),
    location: zod_1.z.string().optional(),
    minRating: zod_1.z.number().min(0).max(5).optional(),
    sortBy: zod_1.z.enum(['reputation', 'rating', 'recent', 'availability']).default('reputation'),
    page: zod_1.z.string().transform(Number).default(1),
    limit: zod_1.z.string().transform(Number).default(20)
});
// Search and discover users
router.get('/search', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const validatedData = searchUsersSchema.parse(req.query);
        const page = validatedData.page;
        const limit = validatedData.limit;
        const skip = (page - 1) * limit;
        // Build where clause
        const whereClause = {
            id: { not: userId }, // Exclude current user
            profile: {
                isComplete: true // Only show users with complete profiles
            }
        };
        // Add search filters
        if (validatedData.query) {
            whereClause.OR = [
                { name: { contains: validatedData.query, mode: 'insensitive' } },
                { profile: { displayName: { contains: validatedData.query, mode: 'insensitive' } } },
                { profile: { bio: { contains: validatedData.query, mode: 'insensitive' } } }
            ];
        }
        if (validatedData.skills && validatedData.skills.length > 0) {
            whereClause.profile = {
                ...whereClause.profile,
                skills: {
                    hasSome: validatedData.skills
                }
            };
        }
        if (validatedData.location) {
            whereClause.profile = {
                ...whereClause.profile,
                location: { contains: validatedData.location, mode: 'insensitive' }
            };
        }
        if (validatedData.minRating) {
            whereClause.profile = {
                ...whereClause.profile,
                ratingAvg: { gte: validatedData.minRating }
            };
        }
        // Build order by clause
        let orderBy = { createdAt: 'desc' };
        switch (validatedData.sortBy) {
            case 'reputation':
                orderBy = { reputation: 'desc' };
                break;
            case 'rating':
                orderBy = { profile: { ratingAvg: 'desc' } };
                break;
            case 'recent':
                orderBy = { lastActiveAt: 'desc' };
                break;
            case 'availability':
                // This would require more complex logic based on availability schedule
                orderBy = { reputation: 'desc' };
                break;
        }
        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where: whereClause,
                include: {
                    profile: {
                        select: {
                            displayName: true,
                            bio: true,
                            skills: true,
                            location: true,
                            ratingAvg: true,
                            totalRatings: true,
                            avatarUrl: true,
                            introMedia: true
                        }
                    }
                },
                orderBy,
                skip,
                take: limit
            }),
            prisma.user.count({
                where: whereClause
            })
        ]);
        // Format users for display
        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            reputation: user.reputation,
            lastActiveAt: user.lastActiveAt,
            profile: user.profile ? {
                ...user.profile,
                trustBadge: getTrustBadge(user.profile.ratingAvg || 0, user.profile.totalRatings || 0)
            } : null
        }));
        res.json({
            users: formattedUsers,
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        });
    }
    catch (error) {
        console.error('Error searching users:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get recommended users for current user
router.get('/recommendations', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Get current user's profile
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: {
                    select: {
                        skills: true,
                        location: true,
                        categories: true
                    }
                }
            }
        });
        if (!currentUser?.profile) {
            return res.json({ users: [] });
        }
        // Get users with similar skills
        const skillRecommendations = await prisma.user.findMany({
            where: {
                id: { not: userId },
                profile: {
                    isComplete: true,
                    skills: {
                        hasSome: currentUser.profile.skills
                    }
                }
            },
            include: {
                profile: {
                    select: {
                        displayName: true,
                        bio: true,
                        skills: true,
                        location: true,
                        ratingAvg: true,
                        totalRatings: true,
                        avatarUrl: true,
                        introMedia: true
                    }
                }
            },
            take: 10,
            orderBy: { reputation: 'desc' }
        });
        // Get users in same location
        const locationRecommendations = await prisma.user.findMany({
            where: {
                id: { not: userId },
                profile: {
                    isComplete: true,
                    location: currentUser.profile.location
                }
            },
            include: {
                profile: {
                    select: {
                        displayName: true,
                        bio: true,
                        skills: true,
                        location: true,
                        ratingAvg: true,
                        totalRatings: true,
                        avatarUrl: true,
                        introMedia: true
                    }
                }
            },
            take: 5,
            orderBy: { reputation: 'desc' }
        });
        // Get highly rated users
        const topRatedUsers = await prisma.user.findMany({
            where: {
                id: { not: userId },
                profile: {
                    isComplete: true,
                    ratingAvg: { gte: 4.0 },
                    totalRatings: { gte: 5 }
                }
            },
            include: {
                profile: {
                    select: {
                        displayName: true,
                        bio: true,
                        skills: true,
                        location: true,
                        ratingAvg: true,
                        totalRatings: true,
                        avatarUrl: true,
                        introMedia: true
                    }
                }
            },
            take: 5,
            orderBy: { profile: { ratingAvg: 'desc' } }
        });
        // Combine and deduplicate recommendations
        const allRecommendations = [...skillRecommendations, ...locationRecommendations, ...topRatedUsers];
        const uniqueRecommendations = allRecommendations.filter((user, index, self) => index === self.findIndex(u => u.id === user.id));
        // Format recommendations
        const formattedRecommendations = uniqueRecommendations.map(user => ({
            id: user.id,
            name: user.name,
            reputation: user.reputation,
            lastActiveAt: user.lastActiveAt,
            profile: user.profile ? {
                ...user.profile,
                trustBadge: getTrustBadge(user.profile.ratingAvg || 0, user.profile.totalRatings || 0)
            } : null,
            matchReason: getMatchReason(user, currentUser)
        }));
        res.json({
            users: formattedRecommendations.slice(0, 20) // Limit to 20 recommendations
        });
    }
    catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get available skills/categories
router.get('/skills', async (req, res) => {
    try {
        const skills = await prisma.profile.findMany({
            select: { skills: true },
            where: {
                skills: { not: { equals: [] } }
            }
        });
        // Flatten and count skills
        const skillCounts = {};
        skills.forEach(profile => {
            profile.skills.forEach(skill => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });
        // Sort by frequency and return top skills
        const popularSkills = Object.entries(skillCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 50)
            .map(([skill, count]) => ({ skill, count }));
        res.json({ skills: popularSkills });
    }
    catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Helper functions
function getTrustBadge(averageRating, totalRatings) {
    if (averageRating >= 4.5 && totalRatings >= 20) {
        return 'Gold';
    }
    else if (averageRating >= 4.0 && totalRatings >= 10) {
        return 'Silver';
    }
    else if (averageRating >= 3.5 && totalRatings >= 5) {
        return 'Bronze';
    }
    return 'New';
}
function getMatchReason(user, currentUser) {
    if (user.profile?.location === currentUser.profile?.location) {
        return 'Same location';
    }
    const commonSkills = user.profile?.skills?.filter((skill) => currentUser.profile?.skills?.includes(skill)) || [];
    if (commonSkills.length > 0) {
        return `Similar skills: ${commonSkills.slice(0, 2).join(', ')}`;
    }
    if (user.profile?.ratingAvg && user.profile.ratingAvg >= 4.5) {
        return 'Highly rated';
    }
    return 'Recommended';
}
exports.default = router;
//# sourceMappingURL=discovery.js.map