import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { logger } from "../utils/logger";

export class NotificationService {
  private static instance: NotificationService;
  private io: SocketServer | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize Socket.io with the HTTP server
   */
  initialize(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.io.on("connection", (socket) => {
      logger.info(`Client connected to WebSocket: ${socket.id}`);

      socket.on("subscribe", (userId: string) => {
        socket.join(`user:${userId}`);
        logger.info(`Client ${socket.id} subscribed to updates for user: ${userId}`);
      });

      socket.on("disconnect", () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    logger.info("WebSocket Notification Service initialized");
  }

  /**
   * Emit a notification to a specific user
   */
  notifyUser(userId: string, event: string, data: any) {
    if (!this.io) {
      logger.warn("Notification Service not initialized. Cannot send notification.");
      return;
    }

    this.io.to(`user:${userId}`).emit(event, data);
    logger.info(`Notification sent to user ${userId}: ${event}`);
  }

  /**
   * Broadcast a notification to all connected clients
   */
  broadcast(event: string, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
  }
}

export const notificationService = NotificationService.getInstance();
