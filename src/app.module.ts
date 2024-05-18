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
import { GamesService } from "./games/games.service";
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
import { AdminModule } from './admin/admin.module';
import { AppGateway } from "./app.gateway";
import { CryptocloudService } from './cryptocloud/cryptocloud.service';
import { GatewayModule } from "./gateway/gateway.module";
import { PaymentModule } from './payment/payment.module';
import { TransactionModule } from './transaction/transaction.module';
import { WithdrawHistoryModule } from './withdraw-history/withdraw-history.module';
import { SocketService } from "./gateway/gateway.service";
import { NotificationModule } from './notification/notification.module';
import { Transaction } from "./transaction/entities/transaction.entity";
import { Notification } from "./notification/entities/notification.entity";

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
        entities: [User, Freespin, Card, GameHistory, Transaction, Notification],
        database: configService.getOrThrow("POSTGRES_DB"),
        synchronize: configService.getOrThrow("TYPEORM_AUTOMIGRATE"),
        logging: configService.getOrThrow("TYPEORM_LOGGING"),
      }),
      inject: [ConfigService]
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
    //MailModule
  ],
  controllers: [],
  providers: [GamesService, RedisService, AppGateway, CryptocloudService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
