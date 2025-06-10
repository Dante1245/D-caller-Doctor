import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private authenticated = false;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io({
        autoConnect: false,
      });
    }
    
    if (!this.socket.connected) {
      this.socket.connect();
    }
    
    return this.socket;
  }

  authenticate(userId: string) {
    if (this.socket && !this.authenticated) {
      this.socket.emit('authenticate', { userId });
      this.authenticated = true;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.authenticated = false;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketManager = new SocketManager();
export const getSocket = () => socketManager.getSocket();
