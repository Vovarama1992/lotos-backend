import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { GameHistoryModule } from 'src/game-history/game-history.module';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => GameHistoryModule),
    forwardRef(() => AuthModule),
    forwardRef(() => GatewayModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UsersModule {}
