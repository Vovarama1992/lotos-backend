import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class SocketService {
  public socket: Server = null;

  emitToUser(userId: string, event: string, data: any) {
    if (this.socket) {
      console.log(userId)
      this.socket.in(userId).emit(event, data);
    } else {
      console.error("Socket server is not initialized.");
    }
  }
}
