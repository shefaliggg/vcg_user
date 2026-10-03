import { io } from "socket.io-client";
import { API_ORIGIN } from "../config/api.config";

export const socket = io(API_ORIGIN, {
  transports: ["websocket"],
});
