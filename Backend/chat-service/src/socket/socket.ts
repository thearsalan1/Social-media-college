import { Socket, Server as SocketIOServer } from "socket.io";
import { socketAuthMiddleware } from "./socketAuth.js";
import { logger } from "../config/logger.js";
import { connection as redis } from "../config/redis.js";
import { Conversation } from "../models/Conversation.model.js";
import { canSendMessage } from "../utils/messageValidation.js";
import { statusType } from "../types/types.js";
import { Message } from "../models/Message.model.js";
import { offlineCheckQueue } from "../queue/offlineCheck.queue.js";

export const initialiseIo = (io: SocketIOServer) => {
  io.use(socketAuthMiddleware);

  io.on("connection", async (socket: Socket) => {
    const userId = socket.user!.userId;
    logger.info(`Socket connected: ${socket.id}`, { userId });

    socket.join(`user:${userId}`);

    await redis.set(`online:${userId}`, "true", "EX", 60);
    const pendingJob = await offlineCheckQueue.getJob(`offline-notify:${userId}`);
    if(pendingJob){
      await pendingJob.remove();
       logger.info("Cancelled pending offline notification (user came online)", { userId });
    }

    // JOIN CONVERSATION
    socket.on("join-conversation", async (conversationId: string) => {
      const conversation = await Conversation.findById(conversationId);

      if (
        !conversation ||
        !conversation.participants.includes(socket.user!.userId)
      ) {
        return socket.emit("error", { message: "Access denied" });
      }
      socket.join(`conversation:${conversationId}`);
      logger.info("User joined conversation room", {
        userId: socket.user!.userId,
        conversationId,
      });
    });

    // LEAVE CONVERSATION
    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // SEND MESSAGE
    socket.on("send-message", async ({ conversationId, content, imageUrl }) => {
      try {
        const rateLimitKey = `msg-rate:${userId}`;
        const count = await redis.incr(rateLimitKey);
        if (count === 1) {
          await redis.expire(rateLimitKey, 60);
        }
        if (count > 20) {
          return socket.emit("error", {
            message: "Sending too fast, slow down mate!!",
          });
        }

        const check = await canSendMessage(conversationId, userId);
        if (!check.allowed) {
          return socket.emit("error", { message: check.reason });
        }
        if (check.becomesActive) {
          check.conversation!.status = statusType.Active;
        }
        const message = await Message.create({
          conversationId,
          senderId: userId,
          content,
          imageUrl,
        });

        check.conversation!.lastMessage = content || "[Image]";
        check.conversation!.lastMessageAt = new Date();
        await check.conversation?.save();
        io.to(`conversation:${conversationId}`).emit("new-message", message);
        const otherParticipant = check.conversation!.participants.find(
          (p) => p !== userId,
        );
        if (otherParticipant) {
          io.to(`user:${otherParticipant}`).emit("message-notification", {
            conversationId,
            preview: content || "Sent an image",
          });
          const isRecipientOnline = await redis.exists(
            `online:${otherParticipant}`,
          );
          if (!isRecipientOnline) {
            const jobId = `offline-notify:${otherParticipant}`;
            const existingJob = await offlineCheckQueue.getJob(jobId);
            if (existingJob) {
              await existingJob.remove();
            }
            await offlineCheckQueue.add(
              "check-offline",
              {
                recipientId: otherParticipant,
                conversationId,
                senderId: socket.user!.userId,
                preview: (content || "send an image").subString(0, 50),
              },
              {
                jobId,
                delay: 5 * 60 * 1000,
              },
            );
          }
        }
        logger.info("Message sent via socket", { conversationId, userId });
      } catch (error) {
        logger.error("Socket send-message failed", { error });
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // EDIT MESSAGE
    socket.on("edit-message", async ({ messageId, content }) => {
      try {
        const message = await Message.findById(messageId);

        if (!message) {
          return socket.emit("error", { message: "Message not found" });
        }
        if (message.senderId !== userId) {
          return socket.emit("error", { message: "Not your message" });
        }
        if (message.imageUrl && !message.content) {
          return socket.emit("error", {
            message: "Image messages cannot be edited",
          });
        }

        const fifteenMinutes = 15 * 60 * 1000;
        if (Date.now() - message.createdAt!.getTime() > fifteenMinutes) {
          return socket.emit("error", { message: "Edit window expired" });
        }

        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        io.to(`conversation:${message.conversationId}`).emit(
          "message-edited",
          message,
        );
        logger.info("Message edited via socket", { messageId, userId });
      } catch (error) {
        logger.error("Socket edit-message failed", { error });
        socket.emit("error", { message: "Failed to edit message" });
      }
    });

    // DELETE MESSAGE
    socket.on("delete-message", async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);

        if (!message) {
          return socket.emit("error", { message: "Message not found" });
        }
        if (message.senderId !== userId) {
          return socket.emit("error", { message: "Not your message" });
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = undefined;
        message.imageUrl = null;
        await message.save();

        io.to(`conversation:${message.conversationId}`).emit(
          "message-deleted",
          { messageId },
        );
        logger.info("Message deleted via socket", { messageId, userId });
      } catch (error) {
        logger.error("Socket delete-message failed", { error });
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    // TYPING INDICATORS
    socket.on("typing-start", ({ conversationId }) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit("user-typing", { userId });
    });

    socket.on("typing-stop", ({ conversationId }) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit("user-stopped-typing", { userId });
    });

    socket.on("disconnect", async () => {
      await redis.del(`online:${userId}`);
      logger.info(`Socket disconnected: ${socket.id}`, { userId });
    });
  });
};
