import { useEffect } from "react";
import { socket } from "../services/socket";

export const useSocket = (
  event: string,
  callback: (data: any) => void
) => {
  useEffect(() => {

    if (!socket.connected) {
      socket.connect();
    }

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };

  }, [event, callback]);
};