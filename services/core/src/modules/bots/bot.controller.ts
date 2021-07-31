import { Controller, Get } from '@nestjs/common';

import { BotsService } from './bot.service';

@Controller('/bots')
export class BotController {
  constructor(private readonly botService: BotsService) {}
  @Get()
  getHello(): string {
    return 'Hello bot';
  }

  @Get('/daily')
  async getPriceTest(): Promise<any> {
    const result = await this.botService.builDailyReport();
    return { items: result };
  }
}
