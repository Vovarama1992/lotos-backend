import { Module, forwardRef } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { RedisService } from 'src/redis/redis.service';
import { FreespinModule } from 'src/freespin/freespin.module';
import { GameHistoryModule } from 'src/game-history/game-history.module';

@Module({
  imports: [
    forwardRef(() => FreespinModule),
    forwardRef(() => GameHistoryModule)
  ],
  controllers: [GamesController],
  providers: [GamesService, RedisService],
  exports: [GamesService]
})
export class GamesModule {}
