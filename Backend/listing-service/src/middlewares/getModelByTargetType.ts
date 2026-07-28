import { Comments } from "../models/Comments.Model.js";
import { MarketPlaceItem } from "../models/MarketPlace.model.js";
import { SocialPost } from "../models/SocialPost.model.js";
import { targetType } from "../types/types.js";
import mongoose from "mongoose";

const modelMap: Record<targetType, mongoose.Model<any>> = {
  [targetType.MarketPlace]: MarketPlaceItem,
  [targetType.Post]: SocialPost,
  [targetType.Comment]: Comments,
};

export const getModelByTargetType = (type: targetType) => {
  return modelMap[type];
};
