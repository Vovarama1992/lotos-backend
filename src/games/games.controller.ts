import { Body, Get, Param, Post } from "@nestjs/common";
import { Controller } from "@nestjs/common";
import { GamesService } from "./games.service";
import { getLinkDTO } from "./decorators/getLink.dto";

@Controller("games")
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get("/providers")
  getAllProviders() {
    return this.gamesService.getProviders();
  }

  @Get()
  async getData() {
    return await this.gamesService.getData();
  }

  @Get("/:category")
  async getGamesInCategory(@Param("category") category: string) {
    return await this.gamesService.getGamesInCategory(category);
  }

  @Post("/gameLink")
  async getGameLink(@Body() getLink: getLinkDTO) {
    return await this.gamesService.openGame(getLink);
  }

  @Post("/update")
  async fetchData() {
    return await this.gamesService.fetchData();
  }
}
