import { io } from "socket.io-client";
import { getSocketBaseUrl } from "../utils/runtimeUrls";

const socket = io(getSocketBaseUrl(), {
  autoConnect: false,
});

export default socket;
