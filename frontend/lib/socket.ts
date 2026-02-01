import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class SocketService {
  private socket: Socket | null = null;

  connect(token?: string) {
    if (this.socket) return this.socket;

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: token ? { token } : undefined,
    });

    this.socket.on("connect", () => {
      console.log("✓ Connected to WebSocket server");

      const userId = localStorage.getItem("userId");
      const userToken = token || localStorage.getItem("token");
      if (userId && userToken) {
        this.authenticateForMonitoring(userId, userToken);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("✗ Disconnected from WebSocket server");
    });

    return this.socket;
  }

  authenticateForMonitoring(userId: string, token: string) {
    if (!this.socket) this.connect(token);
    this.socket?.emit("authenticate", { userId, token });
  }

  subscribe(userId: string) {
    if (!this.socket) this.connect();
    this.socket?.emit("subscribe", userId);
  }

  acknowledgeAlert(alertId: string) {
    if (!this.socket) this.connect();
    this.socket?.emit("acknowledge_alert", { alertId });
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on(event, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
