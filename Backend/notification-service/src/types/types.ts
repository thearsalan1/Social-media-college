export interface NotificationInterface {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  sourceService?: string;
  relatedId?: string;
  isRead: boolean;
  emailStatus: "NOT_APPLICABLE" | "SENT" | "FAILED";
}

export interface NotificationData {
  [key: string]: any;
}

export interface rateLimiteOptions {
  windowInSeconds: string;
  maxRequests: number;
  prefix?: string;
}
