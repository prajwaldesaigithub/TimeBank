import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { getPrisma } from './prisma';

const prisma = getPrisma();

type AuthenticatedSocket = Socket & { userId?: string; user?: any };

export function setupSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = (socket as AuthenticatedSocket).handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      (socket as AuthenticatedSocket).userId = user.id;
      (socket as AuthenticatedSocket).user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const aSocket = socket as AuthenticatedSocket;
    console.log(`User ${aSocket.userId} connected`);

    // Join user-specific room
    aSocket.join(`user:${aSocket.userId}`);

    // Join time request rooms
    aSocket.on('join-request', async (requestId: string) => {
      try {
        // Verify user is part of this time request
        const timeRequest = await prisma.timeRequest.findUnique({
          where: { id: requestId },
          select: { senderId: true, receiverId: true }
        });

        if (!timeRequest) {
          socket.emit('error', { message: 'Time request not found' });
          return;
        }

        if (timeRequest.senderId !== aSocket.userId && timeRequest.receiverId !== aSocket.userId) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        aSocket.join(`request:${requestId}`);
        aSocket.emit('joined-request', { requestId });
      } catch (error) {
        aSocket.emit('error', { message: 'Failed to join request' });
      }
    });

    // Join user-specific room for direct messages
    aSocket.on('join-user', (userId: string) => {
      if (userId === aSocket.userId) {
        aSocket.join(`user:${userId}`);
        aSocket.emit('joined-user', { userId });
      }
    });

    // Leave time request room
    aSocket.on('leave-request', (requestId: string) => {
      aSocket.leave(`request:${requestId}`);
    });

    // Handle new messages
    aSocket.on('send-message', async (data: {
      requestId: string;
      content: string;
      messageType?: string;
    }) => {
      try {
        const { requestId, content, messageType = 'TEXT' } = data;

        // Verify user is part of this time request
        const timeRequest = await prisma.timeRequest.findUnique({
          where: { id: requestId },
          select: { senderId: true, receiverId: true }
        });

        if (!timeRequest) {
          socket.emit('error', { message: 'Time request not found' });
          return;
        }

        if (timeRequest.senderId !== aSocket.userId && timeRequest.receiverId !== aSocket.userId) {
          aSocket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            requestId,
            senderId: aSocket.userId!,
            receiverId: timeRequest.senderId === aSocket.userId ? timeRequest.receiverId : timeRequest.senderId,
            content,
            messageType
          },
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

        // Emit message to all users in the request room
        io.to(`request:${requestId}`).emit('new-message', message);

        // Create notification for receiver
        await prisma.notification.create({
          data: {
            userId: message.receiverId!,
            kind: 'NEW_MESSAGE',
            payload: {
              messageId: message.id,
              senderName: message.sender.name,
              content: message.content.substring(0, 100),
              requestId
            }
          }
        });

        // Emit notification to receiver
        io.to(`user:${message.receiverId}`).emit('notification', {
          type: 'NEW_MESSAGE',
          message: `New message from ${message.sender.name}`
        });

      } catch (error) {
        console.error('Error sending message:', error);
        aSocket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle direct messages (without requestId)
    aSocket.on('send-direct-message', async (data: {
      receiverId: string;
      content: string;
      messageType?: string;
    }) => {
      try {
        const { receiverId, content, messageType = 'TEXT' } = data;

        if (aSocket.userId === receiverId) {
          aSocket.emit('error', { message: 'Cannot message yourself' });
          return;
        }

        // Verify receiver exists
        const receiver = await prisma.user.findUnique({
          where: { id: receiverId }
        });

        if (!receiver) {
          aSocket.emit('error', { message: 'Receiver not found' });
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            senderId: aSocket.userId!,
            receiverId: receiverId,
            content,
            messageType
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
          }
        });

        // Emit message to receiver's user room
        io.to(`user:${receiverId}`).emit('new-message', message);

        // Create notification for receiver
        await prisma.notification.create({
          data: {
            userId: receiverId,
            kind: 'NEW_MESSAGE',
            payload: {
              messageId: message.id,
              senderId: aSocket.userId,
              senderName: message.sender.profile?.displayName || message.sender.name,
              content: message.content.substring(0, 100)
            }
          }
        });

        // Emit notification to receiver
        io.to(`user:${receiverId}`).emit('notification', {
          type: 'NEW_MESSAGE',
          message: `New message from ${message.sender.profile?.displayName || message.sender.name}`
        });

      } catch (error) {
        console.error('Error sending direct message:', error);
        aSocket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    aSocket.on('typing-start', (data: { requestId: string }) => {
      aSocket.to(`request:${data.requestId}`).emit('user-typing', {
        userId: aSocket.userId,
        userName: aSocket.user?.name
      });
    });

    aSocket.on('typing-stop', (data: { requestId: string }) => {
      aSocket.to(`request:${data.requestId}`).emit('user-stopped-typing', {
        userId: aSocket.userId
      });
    });

    // Handle time request status updates
    aSocket.on('request-status-update', async (data: {
      requestId: string;
      status: string;
    }) => {
      try {
        const { requestId, status } = data;

        // Verify user is part of this time request
        const timeRequest = await prisma.timeRequest.findUnique({
          where: { id: requestId },
          select: { senderId: true, receiverId: true }
        });

        if (!timeRequest) {
          socket.emit('error', { message: 'Time request not found' });
          return;
        }

        if (timeRequest.senderId !== aSocket.userId && timeRequest.receiverId !== aSocket.userId) {
          aSocket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Emit status update to all users in the request room
        io.to(`request:${requestId}`).emit('request-status-changed', {
          requestId,
          status,
          updatedBy: aSocket.userId
        });

        // Emit notification to the other user
        const otherUserId = timeRequest.senderId === aSocket.userId ? timeRequest.receiverId : timeRequest.senderId;
        io.to(`user:${otherUserId}`).emit('notification', {
          type: 'REQUEST_STATUS_UPDATE',
          message: `Time request status updated to ${status}`
        });

      } catch (error) {
        console.error('Error updating request status:', error);
        aSocket.emit('error', { message: 'Failed to update request status' });
      }
    });

    // Handle user online status
    aSocket.on('update-status', async (status: 'online' | 'away' | 'busy') => {
      try {
        await prisma.user.update({
          where: { id: aSocket.userId! },
          data: { lastActiveAt: new Date() }
        });

        // Broadcast status to relevant users
        aSocket.broadcast.emit('user-status-changed', {
          userId: aSocket.userId,
          status
        });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    });

    // Handle disconnection
    aSocket.on('disconnect', () => {
      console.log(`User ${aSocket.userId} disconnected`);
      
      // Broadcast offline status
      aSocket.broadcast.emit('user-status-changed', {
        userId: aSocket.userId,
        status: 'offline'
      });
    });
  });

  return io;
}

export default setupSocketIO;
