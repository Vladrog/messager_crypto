import io from "socket.io-client";

const socket = io("http://192.168.0.155:9999");

export default socket;