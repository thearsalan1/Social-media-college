import { Conversation } from "../models/Conversation.model.js";
import { isBlockedEitherWay } from "./chatHelpers.js";

export const canSendMessage = async (
  conversationId: string,
  userId: string,
) => {
  const conversation = await Conversation.findById({ conversationId });
  if (!conversation) {
    return {
      allowed: false,
      reason: "Conversation not found",
      conversation: null,
    };
  }
  if (!conversation.participants.includes(userId)) {
    return { allowed: false, reason: "Not a participant", conversation: null };
  }
  const otherParticipant = conversation.participants.find((p) => p !== userId)!;

  if (await isBlockedEitherWay(userId, otherParticipant)) {
    return {
      allowed: false,
      reason: "Cannot send message",
      conversation: null,
    };
  }
  if (
    conversation.status === "PENDING" &&
    conversation.requestedBy !== userId
  ) {
    return { allowed: true, conversation, becomesActive: true };
  }
  if (
    conversation.status === "PENDING" &&
    conversation.requestedBy === userId
  ) {
    return {
      allowed: false,
      reason: "Waiting for reply before sending another message",
      conversation: null,
    };
  }
  return { allowed: true, conversation, becomesActive: false };
};
