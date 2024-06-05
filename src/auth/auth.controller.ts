import {
  Controller,
  Post,
  Req,
  Body,
  ForbiddenException,
  UseInterceptors,
  BadRequestException,
  Res,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginResponse } from "./type/loginResponse";
import * as bcrypt from "bcryptjs";
import { User } from "src/user/entities/user.entity";
import { LoginUserDto } from "./dto/loginUser.dto";
import { UserService } from "../user/user.service";
import { CookieInterceptor } from "./interceptor/cookie.interceptor";
import { CheckUserRegister, RegisterUserDto } from "./dto/registerUser.dto";
import { CodeCheckDto } from "./dto/codeCheck.dto";
import { MailService } from "src/mail/mail.service";
import { RedisService } from "src/redis/redis.service";
import { v4 as uuidv4 } from "uuid";
import { ReferralInviteService } from "src/referral-invite/referral-invite.service";
import { error } from "console";
import { UserReferralService } from "src/user-referral/user-referral.service";

@UseInterceptors(CookieInterceptor)
@Controller("/auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    // private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly referralInviteService: ReferralInviteService,
    private readonly userReferralService: UserReferralService
  ) {}

  @Post("check")
  async checkRegister(@Body() loginUserDto: CheckUserRegister) {
    const { email, phone } = loginUserDto;
    let existingUser = await this.userService.findOneByCredentials(
      email,
      phone
    );
    return existingUser ? true : false;
  }

  @Post("sign")
  async registerUser(@Body() loginUserDto: RegisterUserDto) {
    const { email, phone, password } = loginUserDto;
    let existingUser = await this.userService.findOneByCredentials(
      email,
      phone
    );
    const isNew = existingUser ? false : true;

    let manager = null;

    // connect new user to manager by referral_invitation_id
    if (loginUserDto.referral_invitation_id) {
      const referralInvitation = await this.referralInviteService.findOne(
        loginUserDto.referral_invitation_id
      );
      await this.referralInviteService.acceptReferralInvitation(
        loginUserDto.referral_invitation_id
      );
      manager = referralInvitation.manager;
    }

    if (email) {
      if (existingUser) {
        let isValid = await bcrypt.compare(password, existingUser.password);
        if (!isValid)
          throw new ForbiddenException("Login or password is invalid");
      } else {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        //save new user
        existingUser = await this.userService.saveUser({
          manager,
          email,
          password: hashedPassword,
        });
        //this.mailService.mailConfirm(email)

        //add referral records to user-referral table
        if (loginUserDto.user_referral_id) {
          await this.userReferralService.addReferral(
            loginUserDto.user_referral_id,
            existingUser.id
          );
        }
      }
      const { id, role } = existingUser;
      const tokens = this.authService.assignTokens(id, role);
      return {
        status: "success",
        isNew: isNew,
        tokens,
      };
    }
    if (phone) {
      const code = Math.floor(100000 + Math.random() * 900000);
      this.authService.sendCode(phone, code);
      this.redisService.setCode(phone, code);

      if (!existingUser) {
        existingUser = await this.userService.saveUser({
          manager,
          phone: phone,
        });
      }
      return {
        status: "success",
        isNew: isNew,
        message: "Код успешно отправлен",
      };
    }
  }

  private isEmail(login: string): boolean {
    return /\S+@\S+\.\S+/.test(login);
  }

  @Post("/sendCode")
  async sendCode(@Body() data, @Res() response) {
    const code = uuidv4();
    this.redisService.setCode(code, data.email);
    //await this.mailService.codeSend(data.email, "http://lotos.na4u.ru/?restoreCode=" + code.toString())
    return response.status(HttpStatus.OK).json({
      status: "success",
      message: "Ссылка на восстановление успешно отправлена",
    });
  }

  @Post("/restore")
  async restore(@Body() data: any, @Res() response) {
    const email = await this.redisService.get(data.code);
    if (email !== null) {
      let existingUser = await this.userService.findOneByEmail(email);
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);
      existingUser = await this.userService.saveUser({
        password: hashedPassword,
      });
      const { id, role } = existingUser;
      const tokens = this.authService.assignTokens(id, role);
      return response.status(HttpStatus.OK).json({
        status: "success",
        accessToken: tokens.accessToken,
      });
    } else throw new ForbiddenException("Invalid code");
  }

  @Post("checkCode")
  async checkCode(@Body() codeCheck: CodeCheckDto, @Res() response) {
    const code = await this.redisService.get(codeCheck.phone);
    console.log("code", code);
    console.log(codeCheck.code);
    if (codeCheck.code.toString() === code) {
      let existingUser = await this.userService.findOneByCredentials(
        null,
        codeCheck.phone
      );
      if (!existingUser) throw new ForbiddenException("phone is invalid");
      const { id, role } = existingUser;
      const tokens = this.authService.assignTokens(id, role);
      return response.status(HttpStatus.OK).json({
        status: "success",
        accessToken: tokens.accessToken,
        message: "Код успешно проверен",
      });
    } else throw new ForbiddenException("Invalid code");
  }

  @Post("login")
  async loginUser(@Body() loginUserDto: LoginUserDto): Promise<LoginResponse> {
    const { login, password } = loginUserDto;
    let existingUser: Omit<User, "createdAt" | "updatedAt">;
    let isValid: boolean;
    existingUser = await this.userService.findOneByOneCredentials(login);
    if (!existingUser)
      throw new ForbiddenException("Username or password is invalid");
    isValid = await bcrypt.compare(password, existingUser.password);
    if (!isValid)
      throw new ForbiddenException("Username or password is invalid");
    const { id, role } = existingUser;
    const tokens = this.authService.assignTokens(id, role);
    return tokens;
  }

  @Post("refresh-token")
  async getTokens(@Req() req): Promise<LoginResponse> {
    const token = req.cookies["refreshToken"];
    try {
      const { accessToken, refreshToken, user } =
        await this.authService.refreshTokens(token);
      if (accessToken && user) {
        return { accessToken, refreshToken };
      }
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }
}
