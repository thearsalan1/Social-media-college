import { Server as SocketIOServer } from "socket.io";
export const initialiseIo = (io: SocketIOServer) => {
  io.on("conneted", (socket) => {
    console.log(`SOcket io connected successfully ${socket.id}`);
  });
};
