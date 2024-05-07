import { Body, Get, Post } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { GamesService } from './games.service';
import { getLinkDTO } from './decorators/getLink.dto';

@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get()
  async getData() {
    return await this.gamesService.getData();
  }

  @Get('/providers')
  async getProviders() {
    return await this.gamesService.getProviders();
  }

  @Post('/gameLink')
  async getGameLink(@Body() getLink: getLinkDTO) {
    return await this.gamesService.openGame(getLink);
  }

  @Post('/update')
  async fetchData() {
    return await this.gamesService.fetchData();
  }
}
