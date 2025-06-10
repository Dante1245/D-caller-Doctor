import { Server as SocketIOServer, Socket } from "socket.io";
import type { IStorage } from "./storage";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocketHandlers(io: SocketIOServer, storage: IStorage) {
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('User connected:', socket.id);

    // Authentication middleware for socket
    socket.on('authenticate', async (data) => {
      try {
        const { userId } = data;
        const user = await storage.getUser(userId);
        if (user) {
          socket.userId = userId;
          socket.join(`user:${userId}`);
          socket.emit('authenticated', { success: true, user });
          
          // Broadcast user online status
          socket.broadcast.emit('user:online', { userId, user });
        } else {
          socket.emit('authentication_error', { message: 'Invalid user' });
        }
      } catch (error) {
        socket.emit('authentication_error', { message: 'Authentication failed' });
      }
    });

    // WebRTC signaling
    socket.on('call:offer', async (data) => {
      const { recipientId, offer, callId } = data;
      socket.to(`user:${recipientId}`).emit('call:incoming', {
        callerId: socket.userId,
        offer,
        callId,
      });
    });

    socket.on('call:answer', (data) => {
      const { callerId, answer, callId } = data;
      socket.to(`user:${callerId}`).emit('call:answered', {
        answer,
        callId,
      });
    });

    socket.on('call:ice-candidate', (data) => {
      const { recipientId, candidate } = data;
      socket.to(`user:${recipientId}`).emit('call:ice-candidate', {
        candidate,
        senderId: socket.userId,
      });
    });

    socket.on('call:reject', (data) => {
      const { callerId, callId } = data;
      socket.to(`user:${callerId}`).emit('call:rejected', { callId });
    });

    socket.on('call:end', (data) => {
      const { recipientId, callId } = data;
      socket.to(`user:${recipientId}`).emit('call:ended', { callId });
    });

    // Real-time messaging
    socket.on('message:send', async (data) => {
      try {
        const { recipientId, content, type = 'text' } = data;
        const message = await storage.sendMessage({
          senderId: socket.userId!,
          recipientId,
          content,
          type,
        });

        // Send to recipient
        socket.to(`user:${recipientId}`).emit('message:received', message);
        
        // Confirm to sender
        socket.emit('message:sent', message);
      } catch (error) {
        socket.emit('message:error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:typing', (data) => {
      const { recipientId } = data;
      socket.to(`user:${recipientId}`).emit('message:typing', {
        senderId: socket.userId,
      });
    });

    socket.on('message:stop-typing', (data) => {
      const { recipientId } = data;
      socket.to(`user:${recipientId}`).emit('message:stop-typing', {
        senderId: socket.userId,
      });
    });

    // TTS during calls
    socket.on('tts:send', async (data) => {
      try {
        const { callId, message, voiceId, recipientId } = data;
        
        const ttsMessage = await storage.addTtsMessage({
          callId,
          message,
          voiceId,
        });

        // Send TTS to call participants
        socket.to(`user:${recipientId}`).emit('tts:received', {
          message,
          voiceId,
          callId,
        });

        socket.emit('tts:sent', ttsMessage);
      } catch (error) {
        socket.emit('tts:error', { message: 'Failed to send TTS' });
      }
    });

    // Call status updates
    socket.on('call:status-update', async (data) => {
      try {
        const { callId, status, duration } = data;
        const updates: any = { status };
        
        if (status === 'active' && !data.startedAt) {
          updates.startedAt = new Date();
        } else if (status === 'ended') {
          updates.endedAt = new Date();
          if (duration) updates.duration = duration;
        }

        const call = await storage.updateCall(callId, updates);
        
        // Broadcast status update
        if (call.recipientId) {
          socket.to(`user:${call.recipientId}`).emit('call:status-updated', call);
        }
        socket.to(`user:${call.initiatorId}`).emit('call:status-updated', call);
      } catch (error) {
        socket.emit('call:error', { message: 'Failed to update call status' });
      }
    });

    // File sharing
    socket.on('file:share', async (data) => {
      try {
        const { recipientId, fileName, fileSize, fileUrl } = data;
        
        const message = await storage.sendMessage({
          senderId: socket.userId!,
          recipientId,
          content: `Shared file: ${fileName}`,
          type: 'file',
          fileName,
          fileSize,
          fileUrl,
        });

        socket.to(`user:${recipientId}`).emit('file:received', message);
        socket.emit('file:sent', message);
      } catch (error) {
        socket.emit('file:error', { message: 'Failed to share file' });
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      if (socket.userId) {
        socket.broadcast.emit('user:offline', { userId: socket.userId });
      }
    });
  });
}
