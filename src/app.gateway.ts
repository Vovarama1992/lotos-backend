import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { verify } from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { SocketService } from "./gateway/gateway.service";
import { CorsOrigins } from "./constants";

@WebSocketGateway({
  cors: { origin: CorsOrigins},
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private socketService: SocketService
    //private userService: UserService
  ) {}

  @WebSocketServer() public server: Server;
  private logger: Logger = new Logger("AppGateway");

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    console.log('Client disconnected')
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    console.log('Client connected')
  }

  afterInit(server: Server) {
    this.socketService.socket = server;
    this.socketService.socket.on("connection", (socket) => {
      const accessToken = socket.handshake.auth["token"];
      console.log(accessToken);
      let userId = "";
      try {
        const user = verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        userId = user.userId;
      } catch (error) {
        console.log("Not authorized")
        socket.disconnect(true);
      }

      socket.join(userId);
      this.server.to(userId).emit("start", "Hello");

      socket.on("disconnect", () => {
        console.log("Got disconnect!");
      });
    });
  }
}
