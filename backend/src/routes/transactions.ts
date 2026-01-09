import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getPrisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();
const prisma = getPrisma();

// Validation schemas
const buyCreditsSchema = z.object({
  amount: z.number().positive().max(1000), // Max 1000 credits per purchase
  paymentMethod: z.string().optional()
});

// Get user's wallet/credit balance
router.get('/wallet', authMiddleware, async (req: AuthRequest, res) => {
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
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's transaction history
router.get('/history', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { page = '1', limit = '20', type } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {
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
      otherUser: transaction.senderId === userId ? transaction.receiver : transaction.sender,
      // Convert String amount to number for display
      amount: Number(transaction.amount) || 0,
      hours: transaction.type === 'EARNED' || transaction.type === 'SPENT' ? Number(transaction.amount) || 0 : undefined,
      credits: transaction.type === 'BONUS' || transaction.type === 'TRANSFER' ? Number(transaction.amount) || 0 : undefined
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
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Buy credits (mock implementation)
router.post('/buy-credits', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = buyCreditsSchema.parse(req.body);

    // In a real implementation, you would integrate with a payment processor
    // For now, we'll just add the credits directly
    // Get current user credits (stored as String in SQLite)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newCredits = (Number(currentUser.credits) + validatedData.amount).toFixed(2);
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: newCredits
      }
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        senderId: userId,
        receiverId: userId,
        amount: String(validatedData.amount.toFixed(2)),
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
  } catch (error) {
    console.error('Error buying credits:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transfer credits to another user
router.post('/transfer', authMiddleware, async (req: AuthRequest, res) => {
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

    // Check if sender has enough credits (credits stored as String in SQLite)
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    const senderCredits = Number(sender.credits) || 0;
    if (senderCredits < amount) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Perform the transfer
    await prisma.$transaction(async (tx) => {
      // Get current balances
      const senderUser = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } });
      const receiverUser = await tx.user.findUnique({ where: { id: receiverId }, select: { credits: true } });

      if (!senderUser || !receiverUser) {
        throw new Error('User not found');
      }

      // Calculate new balances (credits are stored as String)
      const newSenderCredits = (Number(senderUser.credits) - amount).toFixed(2);
      const newReceiverCredits = (Number(receiverUser.credits) + amount).toFixed(2);

      // Update balances
      await tx.user.update({
        where: { id: userId },
        data: { credits: newSenderCredits }
      });

      await tx.user.update({
        where: { id: receiverId },
        data: { credits: newReceiverCredits }
      });

      // Create transaction records for both users
      await tx.transaction.createMany({
        data: [
          {
            senderId: userId,
            receiverId: receiverId,
            amount: String(amount.toFixed(2)),
            type: 'TRANSFER',
            status: 'COMPLETED',
            description: description || 'Credit transfer',
            completedAt: new Date()
          },
          {
            senderId: userId,
            receiverId: receiverId,
            amount: String(amount.toFixed(2)),
            type: 'TRANSFER',
            status: 'COMPLETED',
            description: description || 'Credit received',
            completedAt: new Date()
          }
        ]
      });

      // Create ledger entries for both users
      await tx.ledgerEntry.createMany({
        data: [
          {
            userId: userId,
            hours: String(amount.toFixed(2)),
            type: 'SPENT',
            description: description || `Transfer to user ${receiverId.substring(0, 8)}`
          },
          {
            userId: receiverId,
            hours: String(amount.toFixed(2)),
            type: 'EARNED',
            description: description || `Transfer from user ${userId.substring(0, 8)}`
          }
        ]
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
  } catch (error) {
    console.error('Error transferring credits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction statistics - Uses LedgerEntry for accurate earned/spent stats
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Use LedgerEntry for accurate earned/spent calculations (this is the source of truth)
    const [
      totalEarnedLedger,
      totalSpentLedger,
      completedTransactions,
      pendingTransactions,
      user
    ] = await Promise.all([
      prisma.ledgerEntry.aggregate({
        where: {
          userId: userId,
          type: 'EARNED'
        },
        _sum: { hours: true }
      }),
      prisma.ledgerEntry.aggregate({
        where: {
          userId: userId,
          type: 'SPENT'
        },
        _sum: { hours: true }
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
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true, reputation: true }
      })
    ]);

    // Calculate totals from ledger entries (hours are stored as String in SQLite)
    const earnedAmount = totalEarnedLedger._sum.hours ? 
      (typeof totalEarnedLedger._sum.hours === 'string' ? Number(totalEarnedLedger._sum.hours) : totalEarnedLedger._sum.hours) : 0;
    const spentAmount = totalSpentLedger._sum.hours ? 
      (typeof totalSpentLedger._sum.hours === 'string' ? Number(totalSpentLedger._sum.hours) : totalSpentLedger._sum.hours) : 0;

    res.json({
      credits: user?.credits ? Number(user.credits) : 0,
      reputation: user?.reputation || 0,
      totalEarned: earnedAmount,
      totalSpent: spentAmount,
      completedTransactions,
      pendingTransactions,
      averageRating: 0, // Will be calculated from ratings if needed
      totalRatings: 0
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
