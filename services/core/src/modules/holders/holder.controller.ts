import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import * as moment from 'moment';
import { ETHGateway } from '../blockchain/eth.gateway';
import { HolderService } from './holder.service';

@Controller('/holders')
export class HolderController {
  constructor(
    private readonly holderService: HolderService,
    private readonly ethGateway: ETHGateway,
  ) { }
  @Get('/balance-statistic')
  async getHolderBalanceStatistic(@Query() query: any) {
    let { date, limit, page, symbol } = query;
    limit = Number(limit);
    page = Number(page);
    symbol = String(symbol).toLowerCase();
    const momentDate = moment(date, 'DD-MM-YYYY HH:mm');
    if (momentDate > moment()) {
      throw new BadRequestException('Invalid date');
    }
    const statistic = await this.holderService.getHolderStatistic(['1h', '24h', '7days', '30days'], momentDate.toDate(), { limit, page, symbol });
    return statistic;
  }

  @Get('/rich-list')
  async getTopHolders(@Query() query: any) {
    const { limit, page, symbol } = query;
    const recentTopHolders = await this.holderService.getTopHolders(symbol, { limit: Number(limit), page: Number(page) });
    return recentTopHolders;
  }
}
