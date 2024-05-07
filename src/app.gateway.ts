import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketService } from './gateway/gateway.service';
import { UserService } from './user/user.service';

@WebSocketGateway({ cors: true })
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private socketService: SocketService,
    private userService: UserService,
  ) {}

  @WebSocketServer() public server: Server;
  private logger: Logger = new Logger('AppGateway');

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  afterInit(server: Server) {
    this.socketService.socket = server;

    this.socketService.socket.on('connection', (socket) => {
      socket.on('join', (userId) => {
        console.log(userId)
        socket.join(userId);
      });

    });
  }
}
