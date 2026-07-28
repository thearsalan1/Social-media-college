import { MarketPlaceItem } from "../models/MarketPlace.model.js";
import { SocialPost } from "../models/SocialPost.model.js";
import { targetType } from "../types/types.js";
import mongoose from "mongoose";

const modelMap: Record<targetType, mongoose.Model<any>> = {
  [targetType.MarketPlace]: MarketPlaceItem,
  [targetType.Post]: SocialPost,
};

export const getModelByTargetType = (type: targetType) => {
  return modelMap[type];
};
