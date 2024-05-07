import { Module, forwardRef } from '@nestjs/common';
import { FreespinService } from './freespin.service';
import { FreespinController } from './freespin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Freespin } from './entities/freespin.entity';
import { GamesModule } from 'src/games/games.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Freespin]),
    forwardRef(() => GamesModule)
  ],
  controllers: [FreespinController],
  providers: [FreespinService],
  exports: [FreespinService]
})
export class FreespinModule { }
