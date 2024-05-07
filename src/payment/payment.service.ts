import { Injectable } from "@nestjs/common";
import { verify } from "jsonwebtoken";

@Injectable()
export class PaymentService {
  verifyPaymentToken(token: string) {
    return verify(token, process.env.CRYPTOCLOUD_SECRET_KEY);
  }
}
