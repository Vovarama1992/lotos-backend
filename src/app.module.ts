import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthMiddleware } from "./auth/middleware/auth.middleware";
import { FreespinModule } from "./freespin/freespin.module";
import { GamesModule } from "./games/games.module";
import { RedisService } from "./redis/redis.service";
import { UsersModule } from "./user/user.module";

import { CardModule } from "./card/card.module";
import { Card } from "./card/entities/card.entity";
import { DocumentsModule } from "./documents/documents.module";
import { Freespin } from "./freespin/entities/freespin.entity";
import { GameHistory } from "./game-history/entities/game-history.entity";
import { GameHistoryModule } from "./game-history/game-history.module";
import { User } from "./user/entities/user.entity";
//import { MailModule } from './mail/mail.module';
import { AdminModule } from "./admin/admin.module";
import { AppGateway } from "./app.gateway";
import { CryptocloudService } from "./cryptocloud/cryptocloud.service";
import { GamePlacement } from "./games/entities/game-placement.entity";
import { GatewayModule } from "./gateway/gateway.module";
import { ManagerBotModule } from "./manager-bot/manager-bot.module";
import { ManagerModule } from "./manager/manager.module";
import { Notification } from "./notification/entities/notification.entity";
import { NotificationModule } from "./notification/notification.module";
import { DepositSession } from "./payment/entities/depositSession.entity";
import { PaymentDetails } from "./payment/entities/paymentDetails.entity";
import { PaymentModule } from "./payment/payment.module";
import { ReferralInvite } from "./referral-invite/entities/referral-invite.entity";
import { ReferralInviteModule } from "./referral-invite/referral-invite.module";
import { Transaction } from "./transaction/entities/transaction.entity";
import { TransactionModule } from "./transaction/transaction.module";
import { UserReferral } from "./user-referral/entities/user-referral.entity";
import { UserReferralModule } from "./user-referral/user-referral.module";
import { WithdrawHistoryModule } from "./withdraw-history/withdraw-history.module";
import { MailModule } from "./mail/mail.module";
import { MailService } from "./mail/mail.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.getOrThrow("POSTGRES_HOST"),
        port: configService.getOrThrow("POSTGRES_PORT"),
        password: configService.getOrThrow("POSTGRES_PASSWORD"),
        username: configService.getOrThrow("POSTGRES_USER"),
        autoLoadEntities: true,
        entities: [
          User,
          Freespin,
          Card,
          GameHistory,
          Transaction,
          Notification,
          ReferralInvite,
          GamePlacement,
          UserReferral,
          DepositSession,
          PaymentDetails,
        ],
        database: configService.getOrThrow("POSTGRES_DB"),
        synchronize: configService.getOrThrow("TYPEORM_AUTOMIGRATE"),
        logging: configService.getOrThrow("TYPEORM_LOGGING"),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    GamesModule,
    FreespinModule,
    CardModule,
    GameHistoryModule,
    DocumentsModule,
    GatewayModule,
    PaymentModule,
    TransactionModule,
    AdminModule,
    WithdrawHistoryModule,
    NotificationModule,
    ManagerModule,
    ReferralInviteModule,
    UserReferralModule,
    ManagerBotModule,
    ConfigModule,
    MailModule
  ],
  controllers: [],
  providers: [RedisService, AppGateway, CryptocloudService, ConfigService, MailService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: "user", method: RequestMethod.POST },
        { path: "auth/check", method: RequestMethod.POST },
        { path: "auth/sendCode", method: RequestMethod.POST },
        { path: "auth/checkCode", method: RequestMethod.POST },
        { path: "auth/sign", method: RequestMethod.POST },
        { path: "auth/telegram", method: RequestMethod.POST },
        { path: "games/(.*)", method: RequestMethod.GET }
      )
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
