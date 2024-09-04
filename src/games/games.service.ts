import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import { FreespinService } from "src/freespin/freespin.service";
import { GameHistoryService } from "src/game-history/game-history.service";
import { RedisService } from "src/redis/redis.service";
import { Repository } from "typeorm";
import { getLinkDTO } from "./decorators/getLink.dto";
import { OpenGameRequest } from "./decorators/openGame.dto";
import { GamePlacement } from "./entities/game-placement.entity";
import { ConfigService } from "src/config/config.service";

@Injectable()
export class GamesService {
  constructor(
    private readonly redisService: RedisService,
    private readonly freespinService: FreespinService,
    private readonly gameHistoryService: GameHistoryService,
    @InjectRepository(GamePlacement)
    private readonly gamePlacementRepository: Repository<GamePlacement>,
    private readonly configService: ConfigService
  ) {}

  private filterUniqueGames(games: any[]) {
    const gamesSet = new Set();

    const addKey = (name: string, provider: string) =>
      gamesSet.add(`${name}#${provider}`);

    const isSetMember = (name: string, provider: string) =>
      gamesSet.has(`${name}#${provider}`);

    return games.filter((game) => {
      const { name, label: provider } = game;
      if (!isSetMember(name, provider)) {
        addKey(name, provider);
        return true;
      }

      return false;
    });
  }

  private filterGames(
    data: any[],
    filter: { provider?: string; name?: string }
  ) {
    return data.filter((game) => {
      let doesMatch = true;
      if (filter.name) {
        if (
          !(game.name as string)
            .toLowerCase()
            .includes(filter.name.toLowerCase())
        )
          doesMatch = false;
      }
      if (filter.provider) {
        if (game.label !== filter.provider) doesMatch = false;
      }

      return doesMatch;
    });
  }

  @Cron("0 */30 * * * *") // Запускается каждые 30 минут
  async fetchData() {
    const requestBody = {
      hall: process.env.HALL_ID,
      key: process.env.HALL_KEY,
      cmd: "gamesList",
    };
    const response = await axios.post(process.env.HALL_API, requestBody, {
      headers: { "Content-Type": "application/json" },
    });
    await this.redisService.del("gameLabels");
    await this.redisService.del("apiData");
    await this.redisService.set(
      "gameLabels",
      JSON.stringify(response.data.content.gameLabels)
    );
    await this.redisService.set(
      "apiData",
      JSON.stringify(response.data.content.gameList)
    );
  }

  async getBonusInfo() {
    const { voyagerAmount, welcomeBonus } = await this.configService.get();
    return { voyagerAmount, welcomeBonus };
  }

  async getGamesInCategory(category: string) {
    const cachedData = await this.redisService.getJSON("apiData");
    const gamesPlacement = await this.gamePlacementRepository.find({
      where: { category },
      order: { order: "ASC" },
    });

    let response = [];
    if (cachedData) {
      response = gamesPlacement.map((placement) => {
        const game = cachedData.find((g) => g.id === placement.game_id);
        return game
          ? { ...game, placement_id: placement.id, order: placement.order }
          : null;
      });
    }

    return response.filter((game) => game != null);
  }

  async getData(filter: { provider?: string; name?: string }) {
    const cachedData = await this.redisService.get("apiData");
    return cachedData
      ? this.filterGames(this.filterUniqueGames(JSON.parse(cachedData)), filter)
      : null;
  }

  async getProviders() {
    const cachedData = await this.redisService.get("gameLabels");
    return cachedData ? JSON.parse(cachedData) : null;
  }

  async openGame(data: getLinkDTO) {
    try {
      const freespin = await this.freespinService.findOne(data.gameId);
      const requestBody: OpenGameRequest = {
        cmd: "openGame",
        hall: process.env.HALL_ID,
        language: "ru",
        key: process.env.HALL_KEY,
        demo: 0,
        login: data.userId,
        gameId: data.gameId,
      };

      console.log(requestBody);

      if (freespin) {
        let bmField = `${freespin.count}|${freespin.bet}`;
        requestBody.bm = bmField;
      }

      const response = await axios.post(
        process.env.HALL_API + "openGame/",
        requestBody
      );
      const result = response.data.content;
      console.log(result);
      if (result.gameRes)
        this.gameHistoryService.create({
          userId: data.userId,
          sessionId: result.gameRes.sessionId,
        });
      return response.data;
    } catch {}
  }
}
