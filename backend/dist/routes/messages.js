"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const prisma = (0, prisma_1.getPrisma)();
// Validation schemas
const sendMessageSchema = zod_1.z.object({
    receiverId: zod_1.z.string().optional(),
    requestId: zod_1.z.string().optional(),
    content: zod_1.z.string().min(1).max(1000),
    messageType: zod_1.z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT')
}).refine(data => data.receiverId || data.requestId, {
    message: "Either receiverId or requestId must be provided"
});
// Send a message
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const validatedData = sendMessageSchema.parse(req.body);
        let messageData = {
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
        }
        else if (validatedData.receiverId) {
            // Direct message
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
        // Create notification for receiver
        if (message.receiverId) {
            await prisma.notification.create({
                data: {
                    userId: message.receiverId,
                    kind: 'NEW_MESSAGE',
                    payload: {
                        messageId: message.id,
                        senderName: message.sender.name,
                        content: message.content.substring(0, 100)
                    }
                }
            });
        }
        res.status(201).json(message);
    }
    catch (error) {
        console.error('Error sending message:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get messages for a conversation
router.get('/conversation/:requestId', auth_1.authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get user's conversations
router.get('/conversations', auth_1.authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Mark messages as read
router.patch('/:requestId/read', auth_1.authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map