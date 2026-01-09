import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getPrisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();
const prisma = getPrisma();

// Validation schemas
const sendMessageSchema = z.object({
  receiverId: z.string().optional(),
  requestId: z.string().optional(),
  content: z.string().min(1).max(1000),
  messageType: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT')
}).refine(data => data.receiverId || data.requestId, {
  message: "Either receiverId or requestId must be provided"
});

// Get direct messages between two users (without requestId)
router.get('/direct/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const otherUserId = req.params.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (userId === otherUserId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Verify other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId }
    });

    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all direct messages between these two users (no requestId)
    const messages = await prisma.message.findMany({
      where: {
        requestId: null,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      include: {
        sender: {
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
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        requestId: null,
        senderId: otherUserId,
        receiverId: userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = sendMessageSchema.parse(req.body);

    let messageData: any = {
      senderId: userId,
      content: validatedData.content,
      messageType: validatedData.messageType
    };

    // Handle TimeRequest messages
    if (validatedData.requestId) {
      // Verify the user is part of this time request
      const timeRequest = await prisma.timeRequest.findUnique({
        where: { id: validatedData.requestId },
        select: { senderId: true, receiverId: true }
      });

      if (!timeRequest) {
        return res.status(404).json({ error: 'Time request not found' });
      }

      if (timeRequest.senderId !== userId && timeRequest.receiverId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      messageData.requestId = validatedData.requestId;
      messageData.receiverId = timeRequest.senderId === userId ? timeRequest.receiverId : timeRequest.senderId;
    } else if (validatedData.receiverId) {
      // Direct message - verify receiver exists
      const receiver = await prisma.user.findUnique({
        where: { id: validatedData.receiverId }
      });

      if (!receiver) {
        return res.status(404).json({ error: 'Receiver not found' });
      }

      if (userId === validatedData.receiverId) {
        return res.status(400).json({ error: 'Cannot message yourself' });
      }

      messageData.receiverId = validatedData.receiverId;
    }

    const message = await prisma.message.create({
      data: messageData,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    // Create notification for receiver, including senderId so frontend can link correctly
    if (message.receiverId) {
      await prisma.notification.create({
        data: {
          userId: message.receiverId,
          kind: 'NEW_MESSAGE',
          payload: {
            messageId: message.id,
            senderId: message.senderId,
            senderName: message.sender.name,
            content: message.content.substring(0, 100),
            requestId: message.requestId || null
          }
        }
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a conversation
router.get('/conversation/:requestId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the user is part of this time request
    const timeRequest = await prisma.timeRequest.findUnique({
      where: { id: requestId },
      select: { senderId: true, receiverId: true }
    });

    if (!timeRequest) {
      return res.status(404).json({ error: 'Time request not found' });
    }

    if (timeRequest.senderId !== userId && timeRequest.receiverId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const messages = await prisma.message.findMany({
      where: { requestId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        requestId,
        receiverId: userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users who sent messages to current user
router.get('/senders', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get unique senders who have sent messages to current user
    const messages = await prisma.message.findMany({
      where: {
        receiverId: userId,
        requestId: null // Only direct messages
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            profile: {
              select: {
                displayName: true,
                location: true,
                ratingAvg: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['senderId']
    });

    // Get unique senders
    const uniqueSenders = Array.from(
      new Map(messages.map(m => [m.senderId, m.sender])).values()
    );

    res.json({ users: uniqueSenders });
  } catch (error) {
    console.error('Error fetching message senders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's conversations
router.get('/conversations', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all time requests where user is involved
    const timeRequests = await prisma.timeRequest.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
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
        },
        receiver: {
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
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Format conversations
    const conversations = timeRequests.map(request => {
      const otherUser = request.senderId === userId ? request.receiver : request.sender;
      const lastMessage = request.messages[0];

      return {
        id: request.id,
        title: request.title,
        otherUser,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          senderName: lastMessage.sender.name,
          createdAt: lastMessage.createdAt
        } : null,
        status: request.status,
        unreadCount: 0 // TODO: Calculate unread count
      };
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark messages as read
router.patch('/:requestId/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the user is part of this time request
    const timeRequest = await prisma.timeRequest.findUnique({
      where: { id: requestId },
      select: { senderId: true, receiverId: true }
    });

    if (!timeRequest) {
      return res.status(404).json({ error: 'Time request not found' });
    }

    if (timeRequest.senderId !== userId && timeRequest.receiverId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.message.updateMany({
      where: {
        requestId,
        receiverId: userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
