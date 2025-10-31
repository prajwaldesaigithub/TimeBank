"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketIO = setupSocketIO;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function setupSocketIO(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });
    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
            socket.userId = user.id;
            socket.user = user;
            next();
        }
        catch (error) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected`);
        // Join user-specific room
        socket.join(`user:${socket.userId}`);
        // Join time request rooms
        socket.on('join-request', async (requestId) => {
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
                if (timeRequest.senderId !== socket.userId && timeRequest.receiverId !== socket.userId) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }
                socket.join(`request:${requestId}`);
                socket.emit('joined-request', { requestId });
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to join request' });
            }
        });
        // Leave time request room
        socket.on('leave-request', (requestId) => {
            socket.leave(`request:${requestId}`);
        });
        // Handle new messages
        socket.on('send-message', async (data) => {
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
                if (timeRequest.senderId !== socket.userId && timeRequest.receiverId !== socket.userId) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }
                // Create message in database
                const message = await prisma.message.create({
                    data: {
                        requestId,
                        senderId: socket.userId,
                        receiverId: timeRequest.senderId === socket.userId ? timeRequest.receiverId : timeRequest.senderId,
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
                        userId: message.receiverId,
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
            }
            catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Handle typing indicators
        socket.on('typing-start', (data) => {
            socket.to(`request:${data.requestId}`).emit('user-typing', {
                userId: socket.userId,
                userName: socket.user?.name
            });
        });
        socket.on('typing-stop', (data) => {
            socket.to(`request:${data.requestId}`).emit('user-stopped-typing', {
                userId: socket.userId
            });
        });
        // Handle time request status updates
        socket.on('request-status-update', async (data) => {
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
                if (timeRequest.senderId !== socket.userId && timeRequest.receiverId !== socket.userId) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }
                // Emit status update to all users in the request room
                io.to(`request:${requestId}`).emit('request-status-changed', {
                    requestId,
                    status,
                    updatedBy: socket.userId
                });
                // Emit notification to the other user
                const otherUserId = timeRequest.senderId === socket.userId ? timeRequest.receiverId : timeRequest.senderId;
                io.to(`user:${otherUserId}`).emit('notification', {
                    type: 'REQUEST_STATUS_UPDATE',
                    message: `Time request status updated to ${status}`
                });
            }
            catch (error) {
                console.error('Error updating request status:', error);
                socket.emit('error', { message: 'Failed to update request status' });
            }
        });
        // Handle user online status
        socket.on('update-status', async (status) => {
            try {
                await prisma.user.update({
                    where: { id: socket.userId },
                    data: { lastActiveAt: new Date() }
                });
                // Broadcast status to relevant users
                socket.broadcast.emit('user-status-changed', {
                    userId: socket.userId,
                    status
                });
            }
            catch (error) {
                console.error('Error updating user status:', error);
            }
        });
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User ${socket.userId} disconnected`);
            // Broadcast offline status
            socket.broadcast.emit('user-status-changed', {
                userId: socket.userId,
                status: 'offline'
            });
        });
    });
    return io;
}
exports.default = setupSocketIO;
//# sourceMappingURL=socket.js.map