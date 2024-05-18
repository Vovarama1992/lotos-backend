import { Injectable } from "@nestjs/common";
import { verify } from "jsonwebtoken";
import { SocketService } from "src/gateway/gateway.service";

@Injectable()
export class PaymentService {
  constructor(){}
  verifyPaymentToken(token: string) {
    return verify(token, process.env.CRYPTOCLOUD_SECRET_KEY);
  }
}
