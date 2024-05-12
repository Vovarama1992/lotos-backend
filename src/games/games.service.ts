import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from 'src/redis/redis.service';
import axios from 'axios';
import { getLinkDTO } from './decorators/getLink.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FreespinService } from 'src/freespin/freespin.service';
import { OpenGameRequest } from './decorators/openGame.dto';
import { GameHistoryService } from 'src/game-history/game-history.service';
import { error } from 'console';

@Injectable()
export class GamesService {

  constructor(
    private readonly redisService: RedisService,
    private readonly freespinService: FreespinService,
    private readonly gameHistoryService: GameHistoryService
  ) {
   }

  @Cron('0 */30 * * * *') // Запускается каждые 30 минут
  async fetchData() {
    const requestBody = {"hall":"3203325","key":"kvadder","cmd":"gamesList","cdnUrl":"","img":"game_img_2"}
    const response = await axios.post(process.env.HALL_API, requestBody, {headers: {"Content-Type": "application/json"}});
    await this.redisService.del('gameLabels');
    await this.redisService.del('apiData');
    await this.redisService.set('gameLabels', JSON.stringify(response.data.content.gameLabels));
    await this.redisService.set('apiData', JSON.stringify(response.data.content.gameList));
  }

  async getData() {
    await this.fetchData()
    const cachedData = await this.redisService.get('apiData');
    return cachedData ? JSON.parse(cachedData) : null;
  }

  async getProviders() {
    const cachedData = await this.redisService.get('gameLabels');
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
        gameId: data.gameId
      }

      console.log(requestBody)

      if (freespin) {
        let bmField = `${freespin.count}|${freespin.bet}`;
        requestBody.bm = bmField
      }


      const response = await axios.post(process.env.HALL_API + 'openGame/', requestBody);
      const result = response.data.content;
      console.log(result)
      if (result.gameRes) this.gameHistoryService.create({
        userId: data.userId,
        sessionId: result.gameRes.sessionId
      })
      return response.data
    } catch { }
  }

}
