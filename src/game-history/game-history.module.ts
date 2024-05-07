import { Module } from '@nestjs/common';
import { GameHistoryService } from './game-history.service';
import { GameHistoryController } from './game-history.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from './entities/game-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameHistory]),
  ],
  controllers: [GameHistoryController],
  providers: [GameHistoryService],
  exports: [GameHistoryService]
})
export class GameHistoryModule {}
