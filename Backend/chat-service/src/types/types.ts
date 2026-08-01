export enum statusType {
  Pending = "PENDING",
  Active = "ACTIVE",
}

export enum originType {
  Dm = "DM",
  MarketPlace = "MARKETPLACE",
}

export interface messageInterface {
  conversationId: string;
  senderId: string;
  content?: string;
  imageUrl?: string | null;
  isRead: boolean;
  isEdited: boolean;
  editedAt?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
}

export interface converstionInterface {
  participants: string[];
  status: statusType;
  requestedBy?: string;
  originType: originType;
  lastItemId?: string;
  collegeName: string;
  archivedBy: string[];
  lastMessage?: string;
  lastMessageAt?: Date;
}

export interface BlockInterface {
  blockedBy: string;
  blockedUser: string;
}
