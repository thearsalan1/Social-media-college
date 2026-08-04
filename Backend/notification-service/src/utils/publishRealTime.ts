import { connection } from "../config/redis.js";

export async function publishRealtimeNotification(recipientId: string, notification: any) {
  await connection.publish(
    "user-notifications",
    JSON.stringify({ recipientId, notification })
  );
}