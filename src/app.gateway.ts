import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { SocketService } from "./gateway/gateway.service";
import { UserService } from "./user/user.service";
import { verify } from "jsonwebtoken";

@WebSocketGateway()
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private socketService: SocketService,
    //private userService: UserService
  ) {}

  @WebSocketServer() public server: Server;
  private logger: Logger = new Logger("AppGateway");


  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  afterInit(server: Server) {
    this.socketService.socket = server;
    this.socketService.socket.on("connection", (socket) => {
      const accessToken = socket.handshake.headers["authorization"];
      console.log("Connected");
      let userId = "";
      try {
        const user = verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        userId = user.userId;
      } catch (error) {
        socket.disconnect();
      }

      socket.join(userId);
      this.server.to(userId).emit("start", "Hello");

      socket.on("disconnect", () => {
        console.log("Got disconnect!");
      });
    });
  }
}
