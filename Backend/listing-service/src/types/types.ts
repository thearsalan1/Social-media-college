export enum ItemCategory {
  Books = "books",
  Electronics = "electronics",
  Cycle = "cycle",
  Furniture = "furniture",
  Stationery = "stationery",
  Other = "other",
}
export enum itemStatus {
  Available = "Available",
  Sold = "sold",
}

export enum targetType {
  MarketPlace = "MARKETPLACE",
  post = "POST",
}

export interface MarketPlaceInterface {
  title: string;
  description: string;
  price: number;
  category: ItemCategory;
  image: string[];
  status: itemStatus;
  userId: string;
  userName: string;
  collegeName: string;
  branch: string;
  reportCount: number;
  reportedBy: string;
  ishidden: boolean;
  hiddenAt: Date;
}

export interface socialPostInterface {
  content: string;
  image: string[];
  userId: string;
  userName: string;
  collegeName: string;
  branch: string;
  reportCount: number;
  reportedBy: string;
  ishidden: boolean;
  hiddenAt: Date;
}

export interface CommentInterface {
  content: string;
  userId: string;
  userName: string;
  targetType: targetType;
  targetId: string;
  reportCount: number;
  reportedBy: string;
  ishidden: boolean;
  hiddenAt: Date;
}

export interface LikeInterface {
  userId:string,
  targetType:targetType,
  targetId:string
}