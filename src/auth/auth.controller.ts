import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseInterceptors,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import * as bcrypt from "bcryptjs";
import { MailService } from "src/mail/mail.service";
import { RedisService } from "src/redis/redis.service";
import { ReferralInviteService } from "src/referral-invite/referral-invite.service";
import { UserReferralService } from "src/user-referral/user-referral.service";
import { User } from "src/user/entities/user.entity";
import { v4 as uuidv4 } from "uuid";
import { UserService } from "../user/user.service";
import { AuthService } from "./auth.service";
import { CodeCheckDto } from "./dto/codeCheck.dto";
import { GetTelegramAuthDto } from "./dto/get-telegram-auth.dto";
import { LoginUserDto } from "./dto/loginUser.dto";
import { CheckUserRegister, RegisterUserDto } from "./dto/registerUser.dto";
import { CookieInterceptor } from "./interceptor/cookie.interceptor";
import { LoginResponse } from "./type/loginResponse";
import { SendCodeDto } from "./dto/send-code.dto";
import { RestorePasswordDto } from "./dto/restore-password.dto";

@ApiTags("auth")
@UseInterceptors(CookieInterceptor)
@Controller("/auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly referralInviteService: ReferralInviteService,
    private readonly userReferralService: UserReferralService
  ) {}

  @Post("telegram")
  @ApiOperation({
    summary: "Регистрация (вход) с помощью телеграм",
  })
  receiveTelegramAuthData(@Body() data: GetTelegramAuthDto) {
    return this.authService.signInAsTelegramUser(data);
  }

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

    if (email && !password)
      throw new BadRequestException(
        "For email authentication you must provide a password."
      );

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
          email: email.toLowerCase(),
          password: hashedPassword,
        });
        this.mailService.mailConfirm(email);

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

  @Post("/send-code")
  @ApiOperation({
    summary: "Пользователь - отправить ссылку на восстановление пароля",
  })
  async sendCode(@Body() sendCodeDto: SendCodeDto, @Res() response) {
    const code = uuidv4();
    this.redisService.setCode(code, sendCodeDto.email);
    await this.mailService.codeSend(
      sendCodeDto.email,
      `http://lotos.na4u.ru/?restoreCode=${code.toString()}`
    );
    return response.status(HttpStatus.OK).json({
      status: "success",
      message: "Ссылка на восстановление успешно отправлена",
    });
  }

  @Post("/restore")
  @ApiOperation({ summary: "Пользователь - сменить пароль" })
  async restore(@Body() data: RestorePasswordDto, @Res() response: any) {
    const email = await this.redisService.get(data.code);
    if (email !== null) {
      let existingUser = await this.userService.findOneByEmail(email);
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);
      existingUser.password = hashedPassword;
      existingUser = await this.userService.saveUser(existingUser);
      const { id, role } = existingUser;
      const tokens = this.authService.assignTokens(id, role);
      this.redisService.del(data.code)
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
