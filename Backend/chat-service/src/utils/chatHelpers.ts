import { Block } from "../models/Blocked.model.js";

export const getSortedParticipants = (userA: string, userB: string) => {
  return [userA, userB].sort();
};

export const isBlockedEitherWay = async (
  userA: string,
  userB: string,
): Promise<boolean> => {
  const block = await Block.findOne({
    $or: [
      { blockedBy: userA, blockedUser: userB },
      { blockedBy: userB, blockedUser: userA },
    ],
  });
  return !!block;
};
