import { ForbiddenException, Injectable } from "@nestjs/common";
import { sign, verify } from "jsonwebtoken";
import { UserService } from "../user/user.service";
import { AccessTokenPayload, RefreshTokenPayload } from "./type/jwtPayload";
import { UserRole } from "src/constants";
import axios from "axios";
import { GetTelegramAuthDto } from "./dto/get-telegram-auth.dto";
const { createHash, createHmac } = require("crypto");

@Injectable()
export class AuthService {
  private readonly telegramAuthSecret: any;

  constructor(private readonly userService: UserService) {
    this.telegramAuthSecret = createHash("sha256")
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();
  }

  private checkSignature({ hash, ...data }) {
    const checkString = Object.keys(data)
      .sort()
      .filter((k) => data[k])
      .map((k) => `${k}=${data[k]}`)
      .join("\n");

    const hmac = createHmac("sha256", this.telegramAuthSecret)
      .update(checkString)
      .digest("hex");
    return hmac === hash;
  }

  private checkAuthExpired(authDate: number, expirationTimeInSeconds: number) {
    const now = new Date().getTime();
    const timeElapsedInSeconds = (now - authDate * 1000) / 1000;
    return timeElapsedInSeconds < expirationTimeInSeconds;
  }

  async signInAsTelegramUser(data: GetTelegramAuthDto) {
    let existingUser = await this.userService.findOneByTelegramUsername(
      data.username
    );

    const isNew = !existingUser;

    if (!this.checkSignature(data))
      throw new ForbiddenException("Forbidden. Hash mismatch!");

    if (!this.checkAuthExpired(data.auth_date, 60)) {
      throw new ForbiddenException("Forbidden. Auth expired!");
    }

    if (existingUser) {
    } else {
      //create new user

      existingUser = await this.userService.saveUser({
        telegram_username: data.username,
        name: data.first_name,
        surname: data.last_name,
      });
    }

    const { id, role } = existingUser;
    const tokens = this.assignTokens(id, role);
    return {
      status: "success",
      isNew: isNew,
      tokens,
    };
  }

  createAccessToken({ userId, role }: AccessTokenPayload): string {
    return sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "7d",
    });
  }

  createRefreshToken({ userId }: RefreshTokenPayload): string {
    return sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
  }

  assignTokens(userId: string, role: UserRole) {
    return {
      accessToken: this.createAccessToken({ userId, role }),
      refreshToken: this.createRefreshToken({ userId }),
    };
  }

  async refreshTokens(refreshToken: string) {
    const decodedRefreshToken = verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await this.userService.findOneById(decodedRefreshToken.userId);
    if (!user) throw new Error("Please register or sign in.");
    const { id, role } = user;
    const tokens = await this.assignTokens(id, role);
    return {
      user,
      ...tokens,
    };
  }

  async sendCode(phone: string, code: number) {
    const url = "https://api.iqsms.ru/messages/v2/send.json";
    const body = {
      messages: [
        {
          phone: phone,
          clientId: "1",
          text: "Ваш код: " + code,
        },
      ],
      login: process.env.IQSMS_LOGIN,
      password: process.env.IQSMS_PASSWORD,
    };
    const response = await axios.post(url, body);
  }
}
