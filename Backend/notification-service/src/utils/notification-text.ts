import { NotificationData } from "../types/types";


export function generateTitle(type: string, data: NotificationData): string {
  switch (type) {
    case "NEW_COMMENT":
      return "New comment";
    case "NEW_MESSAGE":
      return "New message";
    case "NEW_ANNOUNCEMENT":
      return "New announcement";
    case "CONTENT_AUTO_HIDDEN":
      return "Content flagged for review";
    default:
      return "Notification";
  }
}

export function generateMessage(type: string, data: NotificationData): string {
  switch (type) {
    case "NEW_COMMENT":
      return `${data.commenterName || "Someone"} commented on your ${data.targetType === "MARKETPLACE" ? "item" : "post"}`;
    case "NEW_MESSAGE":
      return `${data.senderName || "Someone"}: ${data.preview || "sent a message"}`;
    case "NEW_ANNOUNCEMENT":
      return `${data.title || "A new announcement"} was posted`;
    case "CONTENT_AUTO_HIDDEN":
      return `Content has been auto-hidden after ${data.reportedBy?.length || 0} reports. Review needed.`;
    default:
      return "You have a new notification";
  }
}