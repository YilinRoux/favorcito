import { io } from "socket.io-client";
import { getSocketBaseUrl } from "../utils/runtimeUrls";

const socket = io(getSocketBaseUrl(), {
  autoConnect: false,
  auth: (cb) => cb({ token: localStorage.getItem("token") }),
});

export default socket;
