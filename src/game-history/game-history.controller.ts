import { Controller, Get, Post, Body, Req, Param, Delete } from '@nestjs/common';
import { GameHistoryService } from './game-history.service';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';
import { UpdateGameHistoryDto } from './dto/update-game-history.dto';

@Controller('game-history')
export class GameHistoryController {
  constructor(private readonly gameHistoryService: GameHistoryService) {}

  @Post()
  create(@Body() createGameHistoryDto: CreateGameHistoryDto) {
    return this.gameHistoryService.create(createGameHistoryDto);
  }

  @Get()
  findAll() {
    return this.gameHistoryService.findAll();
  }

  @Get('/logs')
  getLogs(@Req() req) {
    return this.gameHistoryService.findOne(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gameHistoryService.getLogsBySession(id);
  }
}
