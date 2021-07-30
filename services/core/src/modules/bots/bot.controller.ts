import { Controller } from '@nestjs/common';

import { BotsService } from './bot.service';

@Controller('/bots')
export class BotController {
  constructor(private readonly botService: BotsService) {}
}
