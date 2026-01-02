import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { parseProfileArrays } from '../lib/parseProfile';

const router = Router();
import { getPrisma } from '../lib/prisma';
const prisma = getPrisma();

// Validation schemas
const searchUsersSchema = z.object({
  query: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  sortBy: z.enum(['reputation', 'rating', 'recent', 'availability']).default('reputation'),
  page: z.preprocess((v) => (typeof v === 'string' ? v : String(v)), z.string().transform(Number)).default('1').transform(Number),
  limit: z.preprocess((v) => (typeof v === 'string' ? v : String(v)), z.string().transform(Number)).default('20').transform(Number)
});

// Search and discover users
router.get('/search', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = searchUsersSchema.parse(req.query);

    const page = validatedData.page;
    const limit = validatedData.limit;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
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

    // Note: SQLite stores skills as JSON string, so we'll filter in JavaScript after fetching
    // Store skills filter for post-processing
    const skillsFilter = validatedData.skills && validatedData.skills.length > 0 ? validatedData.skills : null;

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
    let orderBy: any = { createdAt: 'desc' };
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

    const [users, totalCountResult] = await Promise.all([
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
        take: limit * 2 // Fetch more to account for filtering
      }),
      prisma.user.count({
        where: whereClause
      })
    ]);

    // Filter by skills if needed (SQLite stores as JSON string)
    let filteredUsers = users;
    if (skillsFilter && skillsFilter.length > 0) {
      filteredUsers = users.filter(user => {
        if (!user.profile) return false;
        const userSkills = parseProfileArrays(user.profile).skills;
        return skillsFilter.some(skill => userSkills.includes(skill));
      });
    }

    // Limit to requested amount after filtering
    filteredUsers = filteredUsers.slice(0, limit);

    // Format users for display
    const formattedUsers = filteredUsers.map(user => ({
      id: user.id,
      name: user.name,
      reputation: user.reputation,
      lastActiveAt: user.lastActiveAt,
      profile: user.profile ? parseProfileArrays({
        ...user.profile,
        trustBadge: getTrustBadge(user.profile.ratingAvg || 0, user.profile.totalRatings || 0)
      }) : null
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length, // Approximate after filtering
        pages: Math.ceil(filteredUsers.length / limit)
      }
    });
  } catch (error) {
    console.error('Error searching users:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recommended users for current user
router.get('/recommendations', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
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

    // Parse current user's skills from JSON string
    const currentUserSkills = parseProfileArrays(currentUser.profile).skills;
    
    // Get users with similar skills (filter in JavaScript since SQLite stores as JSON string)
    const allUsers = await prisma.user.findMany({
      where: {
        id: { not: userId },
        profile: {
          isComplete: true
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
      take: 50, // Fetch more to filter
      orderBy: { reputation: 'desc' }
    });
    
    // Filter users with similar skills
    const skillRecommendations = allUsers.filter((user: any) => {
      if (!user.profile) return false;
      const userSkills = parseProfileArrays(user.profile).skills;
      return currentUserSkills.some((skill: string) => userSkills.includes(skill));
    }).slice(0, 10);

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
    
    // Parse profile arrays for all recommendation types
    const parsedSkillRecommendations = skillRecommendations.map((user: any) => ({
      ...user,
      profile: user.profile ? parseProfileArrays(user.profile) : null
    }));
    
    const parsedLocationRecommendations = locationRecommendations.map((user: any) => ({
      ...user,
      profile: user.profile ? parseProfileArrays(user.profile) : null
    }));
    
    const parsedTopRatedUsers = topRatedUsers.map((user: any) => ({
      ...user,
      profile: user.profile ? parseProfileArrays(user.profile) : null
    }));

    // Combine and deduplicate recommendations
    const allRecommendations = [...parsedSkillRecommendations, ...parsedLocationRecommendations, ...parsedTopRatedUsers];
    const uniqueRecommendations = allRecommendations.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );

    // Format recommendations
    const formattedRecommendations = uniqueRecommendations.map(user => ({
      id: user.id,
      name: user.name,
      reputation: user.reputation,
      lastActiveAt: user.lastActiveAt,
      profile: user.profile ? parseProfileArrays({
        ...user.profile,
        trustBadge: getTrustBadge(user.profile.ratingAvg || 0, user.profile.totalRatings || 0)
      }) : null,
      matchReason: getMatchReason(user, currentUser)
    }));

    res.json({
      users: formattedRecommendations.slice(0, 20) // Limit to 20 recommendations
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (for user profile page)
router.get('/user/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const targetUserId = req.params.userId;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
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
      }
    });

    if (!user || !user.profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      reputation: user.reputation,
      lastActiveAt: user.lastActiveAt,
      profile: parseProfileArrays({
        ...user.profile,
        trustBadge: getTrustBadge(user.profile.ratingAvg || 0, user.profile.totalRatings || 0)
      })
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available skills/categories
router.get('/skills', async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany({
      select: { skills: true }
    });

    // Flatten and count skills (parse JSON strings)
    const skillCounts: { [key: string]: number } = {};
    profiles.forEach((profile: any) => {
      const skills = parseProfileArrays(profile).skills;
      skills.forEach((skill: string) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    // Sort by frequency and return top skills
    const popularSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([skill, count]) => ({ skill, count }));

    res.json({ skills: popularSkills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
function getTrustBadge(averageRating: number, totalRatings: number): string {
  if (averageRating >= 4.5 && totalRatings >= 20) {
    return 'Gold';
  } else if (averageRating >= 4.0 && totalRatings >= 10) {
    return 'Silver';
  } else if (averageRating >= 3.5 && totalRatings >= 5) {
    return 'Bronze';
  }
  return 'New';
}

function getMatchReason(user: any, currentUser: any): string {
  if (user.profile?.location === currentUser.profile?.location) {
    return 'Same location';
  }
  
  // Parse JSON strings to arrays for SQLite compatibility
  const userSkills = user.profile ? parseProfileArrays(user.profile).skills : [];
  const currentUserSkills = currentUser.profile ? parseProfileArrays(currentUser.profile).skills : [];
  const commonSkills = userSkills.filter((skill: string) => 
    currentUserSkills.includes(skill)
  );
  
  if (commonSkills.length > 0) {
    return `Similar skills: ${commonSkills.slice(0, 2).join(', ')}`;
  }
  
  if (user.profile?.ratingAvg && user.profile.ratingAvg >= 4.5) {
    return 'Highly rated';
  }
  
  return 'Recommended';
}

export default router;
